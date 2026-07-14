import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, f1_score
import shap

def run_automl_pipeline(df: pd.DataFrame, target_column: str):
    """
    Automatic Data Processing, Model Selection, Training, and SHAP Explainability Engine
    """
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' missing from dataset.")

    # 1. Missing Values Treatment & Basic Encoding
    # Numeric columns ko median se fill karenge, categorical ko mode se
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].dtype.name == 'category':
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
            # Factorize categories into numbers
            df[col] = pd.factorize(df[col])[0]
        else:
            df[col] = df[col].fillna(df[col].median())

    # Features (X) aur Target (y) split
    X = df.drop(columns=[target_column])
    y = df[target_column]
    feature_names = X.columns.tolist()

    # 2. Problem Type Detection (Task Identification)
    # Agar target uniquely kam integers ka hai ya text hai -> Classification, nahi toh Regression
    unique_vals = y.nunique()
    is_classification = y.dtype == 'object' or unique_vals < 10
    
    if is_classification:
        y = pd.factorize(y)[0]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        task_type = "Classification"
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        task_type = "Regression"

    # 3. Model Training
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    # 4. Metrics Evaluation (Telemetry Logs)
    metrics = {}
    if is_classification:
        metrics["Accuracy"] = round(accuracy_score(y_test, predictions), 4)
        metrics["F1-Score"] = round(f1_score(y_test, predictions, average='weighted'), 4)
    else:
        metrics["MSE"] = round(mean_squared_error(y_test, predictions), 4)
        metrics["R2-Score"] = round(r2_score(y_test, predictions), 4)

    # 5. Explainable AI Engine (SHAP Values Calculation)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    # Handle different SHAP output formats
    if isinstance(shap_values, list):
        # Older SHAP versions
        shap_values_array = np.array(shap_values)
        global_shap_importance = np.abs(shap_values_array).mean(axis=(0, 1))

    elif isinstance(shap_values, np.ndarray):

        if shap_values.ndim == 3:
            # New SHAP format:
            # (samples, features, classes)
            global_shap_importance = np.abs(shap_values).mean(axis=(0, 2))

        else:
            # Regression / binary classification
            global_shap_importance = np.abs(shap_values).mean(axis=0)

    else:
        raise Exception("Unknown SHAP output format")

    # Clean dict mapping features to their exact SHAP importance
    shap_summary = {
        feature_names[i]: float(global_shap_importance[i])
        for i in range(len(feature_names))
    }
    # Sorting by impact descending
    shap_summary = dict(sorted(shap_summary.items(), key=lambda item: item[1], reverse=True))

    return {
        "task_type": task_type,
        "metrics": metrics,
        "shap_importance": shap_summary,
        "total_rows": len(df),
        "features_count": len(feature_names)
    }


if __name__ == "__main__":
    # Dummy data creation
    data = {
        "Age": [25, 30, 35, 40, 45, 50, 55, 60],
        "Salary": [50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000],
        "Experience": [2, 5, 8, 10, 15, 20, 25, 30],
        "Purchased": [0, 1, 0, 1, 0, 1, 0, 1]
    }
    df = pd.DataFrame(data)
    result = run_automl_pipeline(df,"Purchased")
    print(result)