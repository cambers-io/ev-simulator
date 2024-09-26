from flask import Flask, jsonify, abort, request
import os
import glob
import json

app = Flask(__name__)

file_pattern = "/usr/app/combined*"
last_size = -1

def file_changed():
    global last_size
    file_to_watch = sorted(glob.glob(file_pattern), reverse=True)[0]
    print(file_to_watch)
    current_size = os.path.getsize(file_to_watch)
    if current_size != last_size:
        file_has_changed = True
    else:
        file_has_changed = False
    last_size = current_size
    return file_has_changed

@app.route('/healthz', methods=['GET'])
def healthz():
    if file_changed():
        return jsonify({"status": "OK"})
    else:
        abort(404, description="Page not found")

@app.route('/config/<serial_number>', methods=['GET'])
def get_config(serial_number):
    file_path = f"/usr/app/dist/assets/station-templates/{serial_number}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            config_data = json.load(file)
        return jsonify(config_data)
    else:
        abort(404, description="Config file not found")

@app.route('/config/<serial_number>', methods=['POST'])
def update_config(serial_number):
    file_path = f"/usr/app/dist/assets/station-templates/{serial_number}.json"
    if not request.is_json:
        abort(400, description="Invalid JSON payload")
    config_data = request.get_json()
    with open(file_path, 'w') as file:
        json.dump(config_data, file)
    return jsonify({"status": "Config updated successfully"})


@app.route('/log', methods=['GET'])
def get_log():
    log_file_path = '/var/log/ev-simulator/ev-simulator.log'
    limit = request.args.get('limit', default=1000, type=int)
    if limit > 3000:
        abort(400, description="Limit should be less than 3000 lines")

    if os.path.exists(log_file_path):
        with open(log_file_path, 'r') as file:
            log_data = file.readlines()

        # Get the last `limit` entries
        last_entries = log_data[-limit:]
        return jsonify({"log": ''.join(last_entries)})
    else:
        abort(404, description="Log file not found")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)