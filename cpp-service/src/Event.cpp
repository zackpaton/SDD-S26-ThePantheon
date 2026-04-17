/**
 * @file Event.cpp
 * Base Event implementation: attendee/notification lists, JSON I/O, validation, and cloning.
 */
#include "Event.h"
#include <algorithm>

using json = nlohmann::json;

Event::Event() 
    : id(""), title(""), description(""), date(0), startTime(0), endTime(0),
      location(""), coordinatorId(""), fraternity("") {}

Event::Event(const std::string& id, const std::string& title, const std::string& description,
             std::time_t date, const std::string& location, const std::string& coordinatorId,
            const std::string& fraternity)
    : id(id), title(title), description(description), date(date), startTime(0), endTime(0),
      location(location), coordinatorId(coordinatorId), fraternity(fraternity) {}

/** Adds userId to attendeeIds if not already attending. */
void Event::addAttendee(const std::string& userId) {
    if (!isAttending(userId)) {
        attendeeIds.push_back(userId);
    }
}

/** Removes all occurrences of userId from the attendee list. */
void Event::removeAttendee(const std::string& userId) {
    attendeeIds.erase(
        std::remove(attendeeIds.begin(), attendeeIds.end(), userId),
        attendeeIds.end()
    );
}

/** Adds or removes userId from notificationAttendeeIds depending on enabled. */
void Event::toggleNotification(const std::string& userId, bool enabled) {
    if (enabled) {
        if (std::find(notificationAttendeeIds.begin(), notificationAttendeeIds.end(), userId) == notificationAttendeeIds.end()) {
            notificationAttendeeIds.push_back(userId);
        }
    } else {
        notificationAttendeeIds.erase(
            std::remove(notificationAttendeeIds.begin(), notificationAttendeeIds.end(), userId),
            notificationAttendeeIds.end()
        );
    }
}

/** Appends userId to notifiedAttendeeIds after a reminder is successfully sent. */
void Event::notificationSent(const std::string& userId) {
    if (std::find(notifiedAttendeeIds.begin(), notifiedAttendeeIds.end(), userId) == notifiedAttendeeIds.end()) {
        notifiedAttendeeIds.push_back(userId);
    }
}

/** Returns whether userId appears in attendeeIds. */
bool Event::isAttending(const std::string& userId) const {
    return std::find(attendeeIds.begin(), attendeeIds.end(), userId) != attendeeIds.end();
}

/** Serializes core fields, type tag, and id arrays to a nlohmann::json object. */
json Event::toJson() const {
    json j;
    j["id"] = id;
    j["title"] = title;
    j["description"] = description;
    j["date"] = static_cast<long long>(date);
    j["startTime"] = static_cast<long long>(startTime);
    j["endTime"] = static_cast<long long>(endTime);
    j["location"] = location;
    j["coordinatorId"] = coordinatorId;
    j["fraternity"] = fraternity;
    j["eventType"] = getEventType();
    j["attendeeIds"] = attendeeIds;
    j["attendeeCount"] = attendeeIds.size();
    j["notificationAttendeeIds"] = notificationAttendeeIds;
    j["notifiedAttendeeIds"] = notifiedAttendeeIds;
    return j;
}

/** Populates fields from JSON (typically from Node or load_events). */
void Event::fromJson(const json& j) {
    id = j.value("id", "");
    title = j.value("title", "");
    description = j.value("description", "");
    date = j.value("date", 0LL);
    startTime = j.value("startTime", 0LL);
    endTime = j.value("endTime", 0LL);
    location = j.value("location", "");
    coordinatorId = j.value("coordinatorId", "");
    fraternity = j.value("fraternity", "");
    
    if (j.contains("attendeeIds")) {
        attendeeIds = j["attendeeIds"].get<std::vector<std::string>>();
    }

    if (j.contains("notificationAttendeeIds")) {
        notificationAttendeeIds = j["notificationAttendeeIds"].get<std::vector<std::string>>();
    }

    if (j.contains("notifiedAttendeeIds")) {
        notifiedAttendeeIds = j["notifiedAttendeeIds"].get<std::vector<std::string>>();
    }
}

/** Basic validation: non-empty id, title, coordinator, and positive date. */
bool Event::isValid() const {
    return !id.empty() && !title.empty() && date > 0 && !coordinatorId.empty();
}

/** Returns a copy of this event as a shared_ptr to the base Event type. */
std::shared_ptr<Event> Event::clone() const {
    return std::make_shared<Event>(*this);
}