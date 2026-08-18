import re
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Intent:
    locations: List[str]
    metrics: List[str]
    timeframe: str
    is_comparison: bool
    is_recommendation: bool

class IntentParser:
    def parse(self, message: str) -> Intent:
        msg = message.lower()
        
        # Simple extraction logic
        locations = []
        if " in " in msg:
            parts = msg.split(" in ")
            locations.append(parts[1].split()[0].strip("?.,"))
            
        metrics = []
        if "temperature" in msg or "hot" in msg or "cold" in msg:
            metrics.append("temperature")
        if "rain" in msg or "umbrella" in msg:
            metrics.append("rain")
            
        timeframe = "current"
        if "tomorrow" in msg:
            timeframe = "tomorrow"
        elif "next week" in msg:
            timeframe = "week"
            
        is_comparison = "vs" in msg or "compare" in msg or "or" in msg
        is_recommendation = "should i" in msg or "recommend" in msg
        
        return Intent(
            locations=locations,
            metrics=metrics,
            timeframe=timeframe,
            is_comparison=is_comparison,
            is_recommendation=is_recommendation
        )

intent_parser = IntentParser()
