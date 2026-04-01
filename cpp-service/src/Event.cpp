#include "Event.h"
#include <algorithm>
#include <sstream>

using json = nlohmann::json;

Event::Event() 
    : id(""), title(""), description(""), date(0), startTime(0), endTime(0),
      location(""), coordinatorId("") {}

Event::Event(const std::string& id, const std::string& title, const std::string& description,
             std::time_t date, const std::string& location, const std::string& coordinatorId)
    : id(id), title(title), description(description), date(date), startTime(0), endTime(0),
      location(location), coordinatorId(coordinatorId) {}

void Event::addAttendee(const std::string& userId) {
    if (!isAttending(userId)) {
        attendeeIds.push_back(userId);
    }
}

void Event::removeAttendee(const std::string& userId) {
    attendeeIds.erase(
        std::remove(attendeeIds.begin(), attendeeIds.end(), userId),
        attendeeIds.end()
    );
}

bool Event::isAttending(const std::string& userId) const {
    return std::find(attendeeIds.begin(), attendeeIds.end(), userId) != attendeeIds.end();
}

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
    j["eventType"] = getEventType();
    j["attendeeIds"] = attendeeIds;
    j["attendeeCount"] = attendeeIds.size();
    return j;
}

void Event::fromJson(const json& j) {
    id = j.value("id", "");
    title = j.value("title", "");
    description = j.value("description", "");
    date = j.value("date", 0LL);
    startTime = j.value("startTime", 0LL);
    endTime = j.value("endTime", 0LL);
    location = j.value("location", "");
    coordinatorId = j.value("coordinatorId", "");
    
    if (j.contains("attendeeIds")) {
        attendeeIds = j["attendeeIds"].get<std::vector<std::string>>();
    }
}

/*
std::string Event::getEventDetails() const {
    std::stringstream ss;
    ss << getEventType() << " Event: " << title;
    if (!location.empty()) {
        ss << " at " << location;
    }
    ss << " (Expected: " << expectedAttendees << ", Attending: " << getActualAttendeeCount() << ")";
    return ss.str();
}

*/

bool Event::isValid() const {
    return !id.empty() && !title.empty() && date > 0 && !coordinatorId.empty();
}

std::shared_ptr<Event> Event::clone() const {
    return std::make_shared<Event>(*this);
}