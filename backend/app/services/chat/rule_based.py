from typing import List, Dict, Any
from app.services.chat.base_provider import LLMProvider
from app.services.chat.intent_parser import intent_parser
from app.services.weather_service import weather_service
from app.services.geocoding_service import geocoding_service
from app.services.chat.response_builder import ResponseBuilder

class RuleBasedProvider(LLMProvider):
    def __init__(self):
        self.response_builder = ResponseBuilder()

    async def generate(self, prompt: str, context: List[Dict[str, Any]]) -> str:
        intent = intent_parser.parse(prompt)
        
        if not intent.locations:
            return "Could you please specify a location? For example, 'What's the weather in London?'"
            
        loc_name = intent.locations[0]
        results = await geocoding_service.search(loc_name)
        if not results:
            return f"I couldn't find the location '{loc_name}'."
            
        target = results[0]
        lat, lon = target["lat"], target["lon"]
        
        if intent.is_recommendation:
            data = await weather_service.get_current_weather(lat, lon)
            return self.response_builder.recommendation_response(target, data)
            
        if intent.timeframe == "current":
            data = await weather_service.get_current_weather(lat, lon)
            return self.response_builder.current_weather_response(target, data)
            
        if intent.timeframe in ["tomorrow", "week"]:
            data = await weather_service.get_forecast(lat, lon, 7)
            return self.response_builder.forecast_response(target, data)
            
        return "I'm sorry, I didn't quite understand the request."
