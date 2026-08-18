from typing import Dict, Any, List

class ResponseBuilder:
    def current_weather_response(self, location: Dict[str, Any], data: Dict[str, Any]) -> str:
        temp = data.get("temperature")
        desc = data.get("description", "unknown")
        city = location.get("name", "the location")
        return f"The current weather in {city} is {desc} with a temperature of {temp}°C."

    def forecast_response(self, location: Dict[str, Any], data: List[Dict[str, Any]]) -> str:
        if not data:
            return "No forecast available."
        tomorrow = data[1] if len(data) > 1 else data[0]
        temp = tomorrow.get("temp_max")
        desc = tomorrow.get("description", "unknown")
        city = location.get("name", "the location")
        return f"Tomorrow in {city}, expect {desc} with a high of {temp}°C."

    def comparison_response(self, locations: List[Dict[str, Any]], data_list: List[Dict[str, Any]]) -> str:
        return "Comparison is not fully implemented yet."

    def recommendation_response(self, location: Dict[str, Any], data: Dict[str, Any]) -> str:
        desc = data.get("description", "").lower()
        if "rain" in desc or data.get("precipitation", 0) > 0:
            return "Yes, you should definitely take an umbrella. It looks like rain."
        return "No need for an umbrella today, the weather looks fine."
