import random
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class GameEngine:
    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty
        self.state = {}
        
        # Difficulty modifiers
        self.difficulty_modifiers = {
            "easy": {"enemy_strength": 0.7, "reward_multiplier": 0.8},
            "medium": {"enemy_strength": 1.0, "reward_multiplier": 1.0},
            "hard": {"enemy_strength": 1.5, "reward_multiplier": 1.2}
        }
    
    def initialize_game(self) -> Dict[str, Any]:
        """Initialize a new game state"""
        self.state = {
            "location": "forest_entrance",
            "health": 100,
            "max_health": 100,
            "inventory": [],
            "visited_locations": ["forest_entrance"],
            "enemies_defeated": 0,
            "secrets_found": 0,
            "game_progress": 0,
            "available_actions": [
                {"type": "move", "name": "Enter Forest", "target": "deep_forest"},
                {"type": "explore", "name": "Search Area", "target": "forest_entrance"}
            ]
        }
        return self.state.copy()
    
    def load_state(self, state: Dict[str, Any]):
        """Load existing game state"""
        self.state = state.copy()
    
    def get_state(self) -> Dict[str, Any]:
        """Get current game state"""
        return self.state.copy()
    
    def process_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Process a game action"""
        result = {
            "success": True,
            "message": "",
            "location": self.state["location"],
            "score_change": 0,
            "game_completed": False
        }
        
        try:
            if action.startswith("move_"):
                direction = action.split("_")[1]
                result.update(self._handle_move(direction))
            elif action.startswith("action_"):
                action_type = action.split("_")[1]
                result.update(self._handle_action(action_type, parameters))
            elif action == "explore":
                result.update(self._handle_explore())
            elif action == "rest":
                result.update(self._handle_rest())
            else:
                result["success"] = False
                result["message"] = "Unknown action"
        
        except Exception as e:
            logger.error(f"Error processing action {action}: {e}")
            result["success"] = False
            result["message"] = "Something went wrong"
        
        return result
    
    def _handle_move(self, direction: str) -> Dict[str, Any]:
        """Handle movement between locations"""
        location_map = {
            "forest_entrance": {"north": "deep_forest", "east": "river_bank"},
            "deep_forest": {"south": "forest_entrance", "west": "ancient_ruins"},
            "river_bank": {"west": "forest_entrance", "north": "waterfall"},
            "ancient_ruins": {"east": "deep_forest", "down": "secret_chamber"}
        }
        
        current = self.state["location"]
        if current not in location_map or direction not in location_map[current]:
            return {"success": False, "message": f"You cannot go {direction} from here"}
        
        new_location = location_map[current][direction]
        self.state["location"] = new_location
        
        if new_location not in self.state["visited_locations"]:
            self.state["visited_locations"].append(new_location)
        
        # Generate available actions for new location
        self._generate_location_actions(new_location)
        
        return {
            "success": True,
            "message": f"You move {direction} to {new_location.replace('_', ' ').title()}",
            "location": new_location,
            "score_change": 10
        }
    
    def _handle_explore(self) -> Dict[str, Any]:
        """Handle exploration action"""
        current = self.state["location"]
        findings = {
            "forest_entrance": [
                {"type": "item", "name": "Health Potion", "chance": 0.3},
                {"type": "enemy", "name": "Wild Wolf", "chance": 0.2},
                {"type": "secret", "name": "Hidden Path", "chance": 0.1}
            ],
            "deep_forest": [
                {"type": "item", "name": "Magic Amulet", "chance": 0.2},
                {"type": "enemy", "name": "Forest Troll", "chance": 0.4},
                {"type": "coin", "amount": 50, "chance": 0.3}
            ]
        }
        
        if current not in findings:
            return {"success": False, "message": "Nothing interesting to find here"}
        
        # Random encounter based on chance
        for finding in findings[current]:
            if random.random() < finding["chance"]:
                if finding["type"] == "item":
                    self.state["inventory"].append(finding["name"])
                    return {
                        "success": True,
                        "message": f"You found a {finding['name']}!",
                        "score_change": 25
                    }
                elif finding["type"] == "enemy":
                    return self._handle_combat(finding["name"])
                elif finding["type"] == "secret":
                    self.state["secrets_found"] += 1
                    return {
                        "success": True,
                        "message": f"You discovered a {finding['name']}!",
                        "score_change": 50
                    }
                elif finding["type"] == "coin":
                    return {
                        "success": True,
                        "message": f"You found {finding['amount']} coins!",
                        "score_change": 15
                    }
        
        return {"success": True, "message": "You search the area but find nothing unusual"}
    
    def _handle_combat(self, enemy_name: str) -> Dict[str, Any]:
        """Handle combat encounter"""
        enemy_power = {
            "Wild Wolf": 20,
            "Forest Troll": 40,
            "Ancient Dragon": 80
        }
        
        power = enemy_power.get(enemy_name, 30)
        power *= self.difficulty_modifiers[self.difficulty]["enemy_strength"]
        
        # Simple combat resolution
        player_roll = random.randint(1, 100)
        enemy_roll = random.randint(1, int(power))
        
        if player_roll > enemy_roll:
            self.state["enemies_defeated"] += 1
            reward = int(30 * self.difficulty_modifiers[self.difficulty]["reward_multiplier"])
            
            # Check for game completion
            game_completed = self.state["enemies_defeated"] >= 5 and self.state["secrets_found"] >= 3
            
            return {
                "success": True,
                "message": f"You defeated the {enemy_name}!",
                "score_change": reward,
                "game_completed": game_completed
            }
        else:
            damage = random.randint(10, 25)
            self.state["health"] = max(0, self.state["health"] - damage)
            
            if self.state["health"] <= 0:
                return {
                    "success": False,
                    "message": f"You were defeated by the {enemy_name}! Game Over.",
                    "game_completed": True
                }
            else:
                return {
                    "success": True,
                    "message": f"The {enemy_name} attacks you for {damage} damage!",
                    "score_change": 5
                }
    
    def _handle_rest(self) -> Dict[str, Any]:
        """Handle rest action to recover health"""
        if self.state["health"] >= self.state["max_health"]:
            return {"success": False, "message": "You are already at full health"}
        
        heal_amount = min(30, self.state["max_health"] - self.state["health"])
        self.state["health"] += heal_amount
        
        return {
            "success": True,
            "message": f"You rest and recover {heal_amount} health",
            "score_change": 5
        }
    
    def _handle_action(self, action_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle various game actions"""
        if action_type == "use":
            item = parameters.get("item")
            if item in self.state["inventory"]:
                self.state["inventory"].remove(item)
                if item == "Health Potion":
                    heal = 50
                    self.state["health"] = min(self.state["max_health"], self.state["health"] + heal)
                    return {
                        "success": True,
                        "message": f"You used a Health Potion and recovered {heal} health",
                        "score_change": 10
                    }
        
        return {"success": False, "message": "Action not available"}
    
    def _generate_location_actions(self, location: str):
        """Generate available actions based on location"""
        base_actions = [
            {"type": "explore", "name": "Search Area", "target": location},
            {"type": "rest", "name": "Rest", "target": location}
        ]
        
        location_specific = {
            "forest_entrance": [
                {"type": "move", "name": "Enter Forest", "target": "deep_forest"},
                {"type": "move", "name": "Follow River", "target": "river_bank"}
            ],
            "deep_forest": [
                {"type": "move", "name": "Return to Entrance", "target": "forest_entrance"},
                {"type": "move", "name": "Explore Ruins", "target": "ancient_ruins"}
            ]
        }
        
        self.state["available_actions"] = base_actions + location_specific.get(location, [])
