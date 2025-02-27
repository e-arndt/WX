import requests
import time
import os
import threading

def clrscr():
    # Check if Operating System is Mac and Linux or Windows
    if os.name == 'posix':
        _ = os.system('clear')
    else:
        # Else Operating System is Windows (os.name = nt)
        _ = os.system('cls')

def printData(temperature, humidity, wind_speed, station_id, solar_radiation, uv_index, wind_dir, wind_chill, wind_gust, pressure, precip_rate):
    print(f"Station ID  : {station_id}")
    print(f"Temperature : {temperature}°F")
    print(f"Humidity    : {humidity}%")
    print(f"Wind Speed  : {wind_speed} mph")
    print(f"Wind Gust   : {wind_gust} mph")
    print(f"Wind Chill  : {wind_chill}°F")
    print(f"Wind Direct : {wind_dir}°")
    print(f"Solar Rad   : {solar_radiation} W/m²")
    print(f"UV Index    : {uv_index}")
    print(f"Pressure    : {pressure} inHg")
    print(f"Precip Rate : {precip_rate} in/hr")

api_key = "032b36ea99f94242ab36ea99f93242eb"
station_id = "KWAFEDER5"
interval = 15  # Polling interval in seconds
max_calls = 1000 # Maximum number of daily calls
call_count = 0  # Initialize call count
exit_flag = False  # Flag to indicate if the user wants to exit

# Base URL for the Weather Underground API
base_url = f"https://api.weather.com/v2/pws/observations/current?stationId={station_id}&format=json&units=e&apiKey={api_key}"

# Function to monitor user input
def monitor_input():
    global exit_flag
    while True:
        user_input = input("Press Enter to exit: ")
        if user_input == "":
            exit_flag = True
            break

# Start the input monitoring in a separate thread
input_thread = threading.Thread(target=monitor_input)
input_thread.start()

while call_count < max_calls and not exit_flag:
    start_time = time.time()  # Record the start time of the loop

    # Send a GET request to the API
    response = requests.get(base_url)

    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        # Extract the necessary information from the JSON data
        temperature = data['observations'][0]['imperial']['temp']
        humidity = data['observations'][0]['humidity']
        wind_speed = data['observations'][0]['imperial']['windSpeed']
        solar_radiation = data['observations'][0]['solarRadiation']
        uv_index = data['observations'][0]['uv']
        wind_dir = data['observations'][0]['winddir']
        wind_chill = data['observations'][0]['imperial']['windChill']
        wind_gust = data['observations'][0]['imperial']['windGust']
        pressure = data['observations'][0]['imperial']['pressure']
        precip_rate = data['observations'][0]['imperial']['precipRate']
        clrscr()
        printData(temperature, humidity, wind_speed, station_id, solar_radiation, uv_index, wind_dir, wind_chill, wind_gust, pressure, precip_rate)
    else:
        print(f"Error: Unable to retrieve data (Status code: {response.status_code})")

    # Increment the call count and display it
    call_count += 1
    print(f"API Call Cnt: {call_count}/{max_calls}")

    # Wait for the specified interval before polling again
    time.sleep(max(0, interval - (time.time() - start_time)))

# Check if the script stopped due to reaching the max calls or user exit
if exit_flag:
    print("User initiated exit. Stopping the script.")
else:
    print("Reached maximum daily API call limit. Stopping the script.")
