/**
 * @file main.cpp
 * Calendar service process: reads newline-delimited JSON commands from stdin (from Node.js),
 * dispatches to the global EventManager, and prints one JSON response per line to stdout.
 */
#include "EventManager.h"
#include "RecruitmentEvent.h"
#include "PhilanthropyEvent.h"
#include "SocialEvent.h"
#include "UserManager.h"
#include "EventFeedbackManager.h"
#include <iostream>
#include <string>
#include <vector>

using json = nlohmann::json;

EventManager globalManager;
UserManager globalUserManager;
EventFeedbackManager globalFeedbackManager;

/** Writes JSON array of all in-memory events to stdout. */
void handleGetAllEvents() {
    json result = globalManager.toJson();
    std::cout << result.dump() << std::endl;
}

/** Looks up a single event by id; prints the event JSON or an error object. */
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

/** Instantiates the correct Event subclass from eventType, validates, and adds to the manager. */
void handleCreateEvent(const json& input) {
    try {
        std::string eventType = input.value("eventType", "Other");
        std::shared_ptr<Event> event;

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

/** Merges JSON into an existing event and persists via EventManager::updateEvent. */
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

/** Removes an event by id from the in-memory store and clears its feedback rows. */
void handleDeleteEvent(const json& input) {
    std::string id = input["id"];
    
    if (globalManager.removeEvent(id)) {
        globalFeedbackManager.removeEventFeedback(id);
        json result;
        result["success"] = true;
        std::cout << result.dump() << std::endl;
    } else {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
    }
}

/** Looks up a single user by Firebase uid; prints JSON or an error object. */
void handleGetUser(const json& input) {
    std::string id = input.value("id", "");
    auto user = globalUserManager.getUser(id);
    if (user) {
        std::cout << user->toJson().dump() << std::endl;
    } else {
        json error;
        error["error"] = "User not found";
        std::cout << error.dump() << std::endl;
    }
}

/** Returns a JSON array of user profiles for the given uid list (sparse entries if missing). */
void handleGetUsersBatch(const json& input) {
    std::vector<std::string> uids;
    if (input.contains("uids") && input["uids"].is_array()) {
        for (const auto& u : input["uids"]) {
            uids.push_back(u.get<std::string>());
        }
    }
    json result = globalUserManager.getUsersBatch(uids);
    std::cout << result.dump() << std::endl;
}

/** JSON array of all users (in-memory). */
void handleGetAllUsers() {
    json result = globalUserManager.getAllUsersJson();
    std::cout << result.dump() << std::endl;
}

/** Creates or replaces a user from a full profile JSON object (includes id, role). */
void handleUpsertUser(const json& input) {
    try {
        if (globalUserManager.upsertFromJson(input)) {
            std::string id = input.value("id", "");
            auto u = globalUserManager.getUser(id);
            json result;
            result["success"] = true;
            result["user"] = u->toJson();
            std::cout << result.dump() << std::endl;
        } else {
            json error;
            error["error"] = "Failed to upsert user";
            std::cout << error.dump() << std::endl;
        }
    } catch (const std::exception& e) {
        json error;
        error["error"] = std::string("Exception: ") + e.what();
        std::cout << error.dump() << std::endl;
    }
}

/** Bulk-replaces users from a JSON array (startup sync from Firebase). */
void handleLoadUsers(const json& input) {
    try {
        if (!input.contains("users") || !input["users"].is_array()) {
            json error;
            error["error"] = "Expected data.users array";
            std::cout << error.dump() << std::endl;
            return;
        }
        globalUserManager.fromJson(input["users"]);
        json result;
        result["success"] = true;
        result["count"] = globalUserManager.getUserCount();
        std::cout << result.dump() << std::endl;
    } catch (const std::exception& e) {
        json error;
        error["error"] = std::string("Exception: ") + e.what();
        std::cout << error.dump() << std::endl;
    }
}

/** Bulk-replaces events from a JSON array (startup sync from Firebase). */
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

/** Bulk-loads event feedback tree from Firebase. */
void handleLoadEventFeedback(const json& input) {
    try {
        json fb = input.value("feedback", json::object());
        globalFeedbackManager.fromJson(fb);
        json ok;
        ok["success"] = true;
        std::cout << ok.dump() << std::endl;
    } catch (const std::exception& e) {
        json err;
        err["error"] = std::string("Exception: ") + e.what();
        std::cout << err.dump() << std::endl;
    }
}

/** Coordinator view: up/down totals and guest rows (display names from UserManager). */
void handleGetEventFeedbackCoordinator(const json& input) {
    std::string eventId = input.value("eventId", "");
    json result = globalFeedbackManager.getCoordinatorView(globalManager, globalUserManager, eventId);
    std::cout << result.dump() << std::endl;
}

/** One guest's feedback row for an event. */
void handleGetEventFeedbackGuest(const json& input) {
    std::string eventId = input.value("eventId", "");
    std::string userId = input.value("userId", "");
    json result = globalFeedbackManager.getGuestView(globalManager, eventId, userId);
    std::cout << result.dump() << std::endl;
}

/** Upserts feedback after Node validates role/RSVP/event-ended. */
void handleUpsertEventFeedback(const json& input) {
    std::string eventId = input.value("eventId", "");
    std::string userId = input.value("userId", "");
    std::string vote = input.value("vote", "");
    std::string comment = input.value("comment", "");
    json result = globalFeedbackManager.upsert(globalManager, eventId, userId, vote, comment);
    std::cout << result.dump() << std::endl;
}


/** (Reserved) Recruitment-specific handler for adding a PNM to an event. */
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
    
    json result;
    result["success"] = true;
    result["event"] = recruitEvent->toJson();
    std::cout << result.dump() << std::endl;
}


/** RSVP: adds attendeeId to the event’s attendee list if not already present. */
void handleAddAttendeeToEvent(const json& input) {
    std::string eventId = input["eventId"];
    std::string attendeeId = input["attendeeId"];
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }
    event->addAttendee(attendeeId);
    json result;
    result["success"] = true;
    result["event"] = event->toJson();
    std::cout << result.dump() << std::endl;
}


/** Un-RSVP: removes attendeeId from the event’s attendee list. */
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

/** Enables or disables reminder notifications for one attendee on an event. */
void handleToggleNotification(const json& input) {
    std::string eventId = input["eventId"];
    std::string attendeeId = input["attendeeId"];
    bool enabled = input["enabled"];

    auto event = globalManager.getEvent(eventId);
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


/** Records that a reminder email was sent so the same user is not notified twice. */
void handleNotificationSent(const json& input) {
    std::string eventId = input["eventId"];
    std::string notifiedId = input["notifiedId"];
    auto event = globalManager.getEvent(eventId);
    if (!event) {
        json error;
        error["error"] = "Event not found";
        std::cout << error.dump() << std::endl;
        return;
    }

    event->notificationSent(notifiedId);
    json result;
    result["success"] = true;
    result["event"] = event->toJson();
    std::cout << result.dump() << std::endl;
}


/** stdin command loop: parse JSON, dispatch by "command", flush stdout after each reply. */
int main() {
    std::string line;

    while (std::getline(std::cin, line)) {
        try {
            json request = json::parse(line);

            std::string command = request["command"];
            json input = request.value("data", json::object());

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
            } else if (command == "load_event_feedback") {
                handleLoadEventFeedback(input);
            } else if (command == "get_event_feedback_coordinator") {
                handleGetEventFeedbackCoordinator(input);
            } else if (command == "get_event_feedback_guest") {
                handleGetEventFeedbackGuest(input);
            } else if (command == "upsert_event_feedback") {
                handleUpsertEventFeedback(input);
            } else if (command == "get_user") {
                handleGetUser(input);
            } else if (command == "get_users_batch") {
                handleGetUsersBatch(input);
            } else if (command == "get_all_users") {
                handleGetAllUsers();
            } else if (command == "upsert_user") {
                handleUpsertUser(input);
            } else if (command == "load_users") {
                handleLoadUsers(input);
            } else if (command == "add_attendee") {
                handleAddAttendeeToEvent(input);
            } else if (command == "remove_attendee") {
                handleRemoveAttendeeFromEvent(input);
            } else if (command == "toggle_notification") {
                handleToggleNotification(input);
            } else if (command == "notification_sent") {
                handleNotificationSent(input);
            } else {
                json error;
                error["error"] = "Unknown command: " + command;
                std::cout << error.dump() << std::endl;
            }

        } catch (const std::exception& e) {
            json error;
            error["error"] = std::string("Exception: ") + e.what();
            std::cout << error.dump() << std::endl;
        }

        std::cout.flush();
    }

    return 0;
}