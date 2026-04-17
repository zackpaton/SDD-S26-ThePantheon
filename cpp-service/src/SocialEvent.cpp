/**
 * @file SocialEvent.cpp
 * Social event subtype: formal flag, alcohol, and capacity with JSON extensions on Event.
 */
#include "SocialEvent.h"

using json = nlohmann::json;

SocialEvent::SocialEvent()
    : Event(), isFormal(false),
      hasAlcohol(false) {}

SocialEvent::SocialEvent(const std::string& id, const std::string& title,
                         const std::string& description, std::time_t date,
                         const std::string& location, const std::string& coordinatorId,
                         const std::string& fraternity, bool isFormal, int maxCapacity)
    : Event(id, title, description, date, location, coordinatorId, fraternity),
      isFormal(isFormal), 
      hasAlcohol(false),
      maxCapacity(maxCapacity) {}


json SocialEvent::toJson() const {
    json j = Event::toJson();
    j["isFormal"] = isFormal;
    j["hasAlcohol"] = hasAlcohol;
    j["maxCapacity"] = maxCapacity;
    return j;
}

void SocialEvent::fromJson(const json& j) {
    Event::fromJson(j);
    isFormal = j.value("isFormal", false);
    hasAlcohol = j.value("hasAlcohol", false);
    maxCapacity = j.value("maxCapacity", 0);
}

bool SocialEvent::isValid() const {
    bool valid = Event::isValid() && maxCapacity > 0;
    return valid;
}

std::shared_ptr<Event> SocialEvent::clone() const {
    return std::make_shared<SocialEvent>(*this);
}