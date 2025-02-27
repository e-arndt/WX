import requests

api_key = "032b36ea99f94242ab36ea99f93242eb"
station_id = "KWAFEDER5"

# Base URL for the Weather Underground API
base_url = f"https://api.weather.com/v2/pws/observations/current?stationId={station_id}&format=json&units=e&apiKey={api_key}"

# Send a GET request to the API
response = requests.get(base_url)

# Check if the request was successful
if response.status_code == 200:
    data = response.json()
    print(data)  # Print the entire JSON response to understand its structure
else:
    print(f"Error: Unable to retrieve data (Status code: {response.status_code})")
