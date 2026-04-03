#include "EventManager.h"
#include "RecruitmentEvent.h"
#include "PhilanthropyEvent.h"
#include "SocialEvent.h"
#include <iostream>
#include <string>

using json = nlohmann::json;

EventManager globalManager;

/**
 * Command handlers for Node.js bridge
 */

void handleGetAllEvents() {
    json result = globalManager.toJson();
    std::cout << result.dump() << std::endl;
}

void handleGetEvent(const json& input) {
    std::string id = input["id"];
    auto event = globalManager.getEvent(id);
    
    if (event) {
        std::cout << event->toJson().dump() << std::endl;
    } else {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
    }
}

void handleCreateEvent(const json& input) {
    try {
        std::string eventType = input.value("eventType", "Other");
        std::shared_ptr<Event> event;
        
        // Create appropriate event type
        if (eventType == "Recruitment") {
            event = std::make_shared<RecruitmentEvent>();
        } else if (eventType == "Philanthropy") {
            event = std::make_shared<PhilanthropyEvent>();
        } else if (eventType == "Social") {
            event = std::make_shared<SocialEvent>();
        } else {
            event = std::make_shared<Event>();
        }
        
        event->fromJson(input);
        
        if (globalManager.addEvent(event)) {
            json result;
            result["success"] = true;
            result["event"] = event->toJson();
            std::cout << result.dump() << std::endl;
        } else {
            json error;
            error["error"] = "Failed to add event - validation failed";
            error["validationErrors"] = globalManager.getValidationErrors(*event);
            std::cout << error.dump() << std::endl;
        }
    } catch (const std::exception& e) {
        json error;
        error["error"] = std::string("Exception: ") + e.what();
        std::cout << error.dump() << std::endl;
    }
}

void handleUpdateEvent(const json& input) {
    try {

        std::string id = input["id"];
        auto existingEvent = globalManager.getEvent(id);

        if (!existingEvent) {
            json error;
            error["error"] = "Event not found";
            std::cout << error.dump() << std::endl;
            return;
        }
        
        // Update the existing event
        existingEvent->fromJson(input);
        if (globalManager.updateEvent(existingEvent)) {
            json result;
            result["success"] = true;
            result["event"] = existingEvent->toJson();
            std::cout << result.dump() << std::endl;
        } else {
            json error;
            error["error"] = "Failed to update event";
            std::cout << error.dump() << std::endl;
        }
    } catch (const std::exception& e) {
        json error;
        error["error"] = std::string("Exception: ") + e.what();
        std::cout << error.dump() << std::endl;
    }
}

void handleDeleteEvent(const json& input) {
    std::string id = input["id"];
    
    if (globalManager.removeEvent(id)) {
        json result;
        result["success"] = true;
        std::cout << result.dump() << std::endl;
    } else {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
    }
}

void handleLoadEvents(const json& input) {
    try {
        globalManager.fromJson(input["events"]);
        json result;
        result["success"] = true;
        result["count"] = globalManager.getEventCount();
        std::cout << result.dump() << std::endl;
    } catch (const std::exception& e) {
        json error;
        error["error"] = std::string("Exception: ") + e.what();
        std::cout << error.dump() << std::endl;
    }
}


void handleAddPNMToEvent(const json& input) {
    std::string eventId = input["eventId"];
    std::string pnmId = input["pnmId"];
    
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    auto recruitEvent = std::dynamic_pointer_cast<RecruitmentEvent>(event);
    if (!recruitEvent) {
        json error;
        error["error"] = "Event is not a recruitment event";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    // recruitEvent->invitePNM(pnmId);
    json result;
    result["success"] = true;
    result["event"] = recruitEvent->toJson();
    std::cout << result.dump() << std::endl;
}


void handleAddAttendeeToEvent(const json& input) {
    std::cerr<<input<<std::endl;
    std::string eventId = input["eventId"];
    std::string attendeeId = input["attendeeId"];
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }
    std::cerr<<event<<std::endl;
    event->addAttendee(attendeeId);
    std::cerr<<event<<std::endl;
    json result;
    result["success"] = true;
    result["event"] = event->toJson();
    std::cout << result.dump() << std::endl;
}


void handleRemoveAttendeeFromEvent(const json& input) {
    std::string eventId = input["eventId"];
    std::string attendeeId = input["attendeeId"];
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }

    event->removeAttendee(attendeeId);
    json result;
    result["success"] = true;
    result["event"] = event->toJson();
    std::cout << result.dump() << std::endl;
}

void handleToggleNotification(const json& input) {
    std::cerr<<input<<std::endl;
    std::string eventId = input["eventId"];
    std::string attendeeId = input["attendeeId"];
    bool enabled = input["enabled"];

    auto event = globalManager.getEvent(eventId);
    std::cerr<<event<<std::endl;
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }

    event->toggleNotification(attendeeId, enabled);
    json result;
    result["success"] = true;
    result["event"] = event->toJson();
    std::cout << result.dump() << std::endl;
}


int main() {
    std::string line;

    // Keep process alive forever
    while (std::getline(std::cin, line)) {
        try {
            json request = json::parse(line);

            std::string command = request["command"];
            json input = request.value("data", json::object());

            // Route commands
            if (command == "get_all_events") {
                handleGetAllEvents();
            } else if (command == "get_event") {
                handleGetEvent(input);
            } else if (command == "create_event") {
                handleCreateEvent(input);
            } else if (command == "update_event") {
                handleUpdateEvent(input);
            } else if (command == "delete_event") {
                handleDeleteEvent(input);
            } else if (command == "load_events") {
                handleLoadEvents(input);
            } else if (command == "add_attendee") {
                handleAddAttendeeToEvent(input);
            } else if (command == "remove_attendee") {
                handleRemoveAttendeeFromEvent(input);
            } else if (command == "toggle_notification") {
                handleToggleNotification(input);
            }
            
            
            
            
            
            else {
                json error;
                error["error"] = "Unknown command: " + command;
                std::cout << error.dump() << std::endl;
            }

        } catch (const std::exception& e) {
            json error;
            error["error"] = std::string("Exception: ") + e.what();
            std::cout << error.dump() << std::endl;
        }

        // 🔑 IMPORTANT: flush so Node receives response immediately
        std::cout.flush();
    }

    return 0;
}