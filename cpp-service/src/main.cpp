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
        std::string eventType = input.value("eventType", "General");
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

void handleGetRecruitmentEvents() {
    auto events = globalManager.getRecruitmentEvents();
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}

void handleGetPhilanthropyEvents() {
    auto events = globalManager.getPhilanthropyEvents();
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}

void handleGetSocialEvents() {
    auto events = globalManager.getSocialEvents();
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}

void handleFilterByLocation(const json& input) {
    std::string location = input["location"];
    auto events = globalManager.getEventsByLocation(location);
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}

void handleFilterByDateRange(const json& input) {
    std::time_t start = input["start"].get<long long>();
    std::time_t end = input["end"].get<long long>();
    auto events = globalManager.getEventsByDateRange(start, end);
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}

void handleGetUpcomingEvents() {
    auto events = globalManager.getUpcomingEvents();
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
}


void handleGetEventsByCoordinator(const json& input) {
    std::string coordinatorId = input["coordinatorId"];
    auto events = globalManager.getEventsByCoordinator(coordinatorId);
    json result = json::array();
    for (const auto& event : events) {
        result.push_back(event->toJson());
    }
    std::cout << result.dump() << std::endl;
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

void handleRecordPNMAttendance(const json& input) {
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
    
    // recruitEvent->recordPNMAttendance(pnmId);
    json result;
    result["success"] = true;
    result["event"] = recruitEvent->toJson();
    std::cout << result.dump() << std::endl;
}

void handleAddDonation(const json& input) {
    std::string eventId = input["eventId"];
    // double amount = input["amount"];
    
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    auto philEvent = std::dynamic_pointer_cast<PhilanthropyEvent>(event);
    if (!philEvent) {
        json error;
        error["error"] = "Event is not a philanthropy event";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    // philEvent->addDonation(amount);
    json result;
    result["success"] = true;
    result["event"] = philEvent->toJson();
    std::cout << result.dump() << std::endl;
}

/*
void handleSellTicket(const json& input) {
    std::string eventId = input["eventId"];
    
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    auto socialEvent = std::dynamic_pointer_cast<SocialEvent>(event);
    if (!socialEvent) {
        json error;
        error["error"] = "Event is not a social event";
        std::cout << error.dump() << std::endl;
        return;
    }
    
    if (socialEvent->sellTicket()) {
        json result;
        result["success"] = true;
        result["event"] = socialEvent->toJson();
        std::cout << result.dump() << std::endl;
    } else {
        json error;
        error["error"] = "Cannot sell ticket - event may be sold out or tickets not required";
        std::cout << error.dump() << std::endl;
    }
}
*/

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
            }
            // Type-specific queries
            else if (command == "get_recruitment_events") {
                handleGetRecruitmentEvents();
            } else if (command == "get_philanthropy_events") {
                handleGetPhilanthropyEvents();
            } else if (command == "get_social_events") {
                handleGetSocialEvents();
            }
            // Filtering
            else if (command == "filter_by_location") {
                handleFilterByLocation(input);
            } else if (command == "filter_by_date_range") {
                handleFilterByDateRange(input);
            } else if (command == "get_upcoming_events") {
                handleGetUpcomingEvents();
            } else if (command == "get_public_events") {
                // handleGetPublicEvents();
            } else if (command == "get_events_by_coordinator") {
                handleGetEventsByCoordinator(input);
            }
            // Statistics
            else if (command == "get_statistics") {
                // handleGetEventStatistics();
            }
            // Recruitment-specific
            else if (command == "get_events_by_rush_round") {
                // handleGetEventsByRushRound(input);
            } else if (command == "add_pnm_to_event") {
                handleAddPNMToEvent(input);
            } else if (command == "record_pnm_attendance") {
                handleRecordPNMAttendance(input);
            }
            // Philanthropy-specific
            else if (command == "add_donation") {
                handleAddDonation(input);
            }
            // Social-specific
            else if (command == "sell_ticket") {
                // handleSellTicket(input);
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