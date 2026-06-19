from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Vercel specific base directory to correctly locate .pkl files at root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pipe_path = os.path.join(base_dir, 'pipe.pkl')
df_path = os.path.join(base_dir, 'df.pkl')

try:
    pipe = pickle.load(open(pipe_path, 'rb'))
    df = pickle.load(open(df_path, 'rb'))
except Exception as e:
    print(f"Error loading models: {e}")
    pipe, df = None, None

@app.route('/api/options', methods=['GET'])
def get_options():
    if df is None:
        return jsonify({"error": "Dataset not loaded"}), 500
    
    options = {
        'Company': df['Company'].unique().tolist(),
        'TypeName': df['TypeName'].unique().tolist(),
        'Cpu_brand': df['Cpu brand'].unique().tolist(),
        'Gpu_brand': df['Gpu brand'].unique().tolist(),
        'os': df['os'].unique().tolist(),
        'RAM': [2, 4, 6, 8, 12, 16, 24, 32, 64],
        'Touchscreen': ['No', 'Yes'],
        'IPS': ['No', 'Yes'],
        'Resolution': ['1920x1080', '1366x768', '1600x900', '3840x2160', '3200x1800', '2880x1800', '2560x1600', '2560x1440', '2304x1440'],
        'HDD': [0, 128, 256, 512, 1024, 2048],
        'SSD': [0, 8, 128, 256, 512, 1024]
    }
    return jsonify(options)

@app.route('/api/predict', methods=['POST'])
def predict():
    if pipe is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        company = data['Company']
        type_name = data['TypeName']
        ram = int(data['RAM'])
        weight = float(data['Weight'])
        touchscreen = 1 if data['Touchscreen'] == 'Yes' else 0
        ips = 1 if data['IPS'] == 'Yes' else 0
        
        screen_size = float(data['ScreenSize'])
        resolution = data['Resolution']
        X_res = int(resolution.split('x')[0])
        Y_res = int(resolution.split('x')[1])
        ppi = ((X_res**2) + (Y_res**2))**0.5 / screen_size
        
        cpu = data['Cpu_brand']
        hdd = int(data['HDD'])
        ssd = int(data['SSD'])
        gpu = data['Gpu_brand']
        os_sys = data['os']
        
        query = np.array([company, type_name, ram, weight, touchscreen, ips, ppi, cpu, hdd, ssd, gpu, os_sys], dtype=object)
        query = query.reshape(1, 12)
        
        predicted_price = int(np.exp(pipe.predict(query)[0]))
        
        return jsonify({"predicted_price": predicted_price})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/')
def serve_index():
    return send_from_directory(base_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(base_dir, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
