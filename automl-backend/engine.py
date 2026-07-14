# Replace complete engine.py with this scoreboard configuration
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, f1_score
# pyrefly: ignore [missing-import]
import shap

def run_automl_pipeline(df: pd.DataFrame, target_column: str):
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' missing.")

    for col in df.columns:
        if df[col].dtype == 'object' or df[col].dtype.name == 'category':
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
            df[col] = pd.factorize(df[col])[0]
        else:
            df[col] = df[col].fillna(df[col].median())

    X = df.drop(columns=[target_column])
    y = df[target_column]
    feature_names = X.columns.tolist()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    unique_vals = y.nunique()
    is_classification = y.dtype == 'object' or unique_vals < 10
    
    leaderboard = {} # NEW: Tracks all algorithm scores

    if is_classification:
        task_type = "Classification"
        y_train = pd.factorize(y_train)[0]
        y_test = pd.factorize(y_test)[0]
        
        classifiers = {
            "Random Forest Classifier": RandomForestClassifier(n_estimators=100, random_state=42),
            "Gradient Boosting Classifier": GradientBoostingClassifier(random_state=42),
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Decision Tree Classifier": DecisionTreeClassifier(random_state=42),
            "Support Vector Classifier (SVC)": SVC(probability=True, random_state=42),
            "K-Nearest Neighbors (KNN)": KNeighborsClassifier()
        }
        
        best_acc = -1
        best_model_name = ""
        best_model = None
        
        for name, clf in classifiers.items():
            try:
                clf.fit(X_train, y_train)
                acc = accuracy_score(y_test, clf.predict(X_test))
                leaderboard[name] = round(acc, 4) # Save score
                if acc > best_acc:
                    best_acc = acc
                    best_model = clf
                    best_model_name = name
            except:
                leaderboard[name] = 0.0
                
        winner_preds = best_model.predict(X_test)
        metrics = {"Accuracy": round(best_acc, 4), "F1-Score": round(f1_score(y_test, winner_preds, average='weighted'), 4)}

    else:
        task_type = "Regression"
        regressors = {
            "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
            "Gradient Boosting Regressor": GradientBoostingRegressor(random_state=42),
            "Linear Regression": LinearRegression(),
            "Decision Tree Regressor": DecisionTreeRegressor(random_state=42),
            "Support Vector Regressor (SVR)": SVR(kernel='rbf')
        }
        
        best_r2 = -float('inf')
        best_model_name = ""
        best_model = None
        
        for name, reg in regressors.items():
            try:
                reg.fit(X_train, y_train)
                r2 = r2_score(y_test, reg.predict(X_test))
                leaderboard[name] = round(r2, 4) # Save score
                if r2 > best_r2:
                    best_r2 = r2
                    best_model = reg
                    best_model_name = name
            except:
                leaderboard[name] = -1.0
                
        winner_preds = best_model.predict(X_test)
        metrics = {"R2-Score": round(best_r2, 4), "MSE": round(mean_squared_error(y_test, winner_preds), 4)}

    # SHAP Generation Block (Fallback architecture preserved)
    try:
        if "Linear" in best_model_name or "Logistic" in best_model_name:
            explainer = shap.LinearExplainer(best_model, X_train)
            shap_values = explainer.shap_values(X_test)
        elif "Forest" in best_model_name or "Tree" in best_model_name or "Boosting" in best_model_name:
            explainer = shap.TreeExplainer(best_model)
            shap_values = explainer.shap_values(X_test)
        else:
            X_summary = shap.kmeans(X_train, 5) if len(X_train) > 5 else X_train
            explainer = shap.KernelExplainer(best_model.predict, X_summary)
            shap_values = explainer.shap_values(X_test)

        if is_classification and isinstance(shap_values, list):
            global_shap_importance = np.abs(shap_values[0]).mean(axis=0)
        else:
            global_shap_importance = np.abs(shap_values).mean(axis=0)
        shap_summary = {feature_names[i]: float(global_shap_importance[i]) for i in range(len(feature_names))}
    except:
        correlations = X_test.corrwith(pd.Series(winner_preds, index=X_test.index)).abs().fillna(0)
        shap_summary = {col: float(correlations[col]) for col in feature_names}

    shap_summary = dict(sorted(shap_summary.items(), key=lambda item: item[1], reverse=True))
    
    # Sort leaderboard descending
    sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda item: item[1], reverse=True))

    return {
        "task_type": task_type,
        "best_algorithm": best_model_name,
        "metrics": metrics,
        "leaderboard": sorted_leaderboard, # <-- NEW DATA FOR THE RACING BOARD
        "shap_importance": shap_summary,
        "total_rows": len(df),
        "features_count": len(feature_names)
    }