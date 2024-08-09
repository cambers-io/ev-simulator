import yaml
from jinja2 import Template

import argparse

parser = argparse.ArgumentParser(description='Generate SAP assets configuration.')
parser.add_argument('yaml', type=str, help='yaml file ')

args = parser.parse_args()

with open(args.yaml) as file:
    values = yaml.load(file, Loader=yaml.FullLoader)

path = "dist/assets/"

with open(path + "config.j2") as file:
    config_template = file.read()
    values["logname"] = str(args.yaml).replace("/", "-")
    with open(path + "config.json", 'w') as f:
        f.write(Template(config_template).render(values))

with open(path + "station-templates/station.j2") as file:
    station_template = file.read()

with open(path + "authorization-tags.j2") as file:
    rfid_template = file.read()

for station in values["stations"]:
    with open(path + "station-templates/" + station["serial"] + ".json", 'w') as f:
        f.write(Template(station_template).render(station))

    with open(path + "authorization-tags-" + station["serial"] + ".json", 'w') as f:
        f.write(Template(rfid_template).render(station))
