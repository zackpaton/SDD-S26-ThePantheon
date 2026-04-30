/**
 * @file PhilanthropyEvent.cpp
 * Philanthropy event subtype: beneficiary and fundraising goal with validation.
 */
#include "PhilanthropyEvent.h"

using json = nlohmann::json;

PhilanthropyEvent::PhilanthropyEvent() : fundraisingGoal(0.0) {}

PhilanthropyEvent::PhilanthropyEvent(const std::string& id, const std::string& title,
                                     const std::string& description, std::time_t date,
                                     const std::string& location, const std::string& coordinatorId,
                                     const std::string& fraternity, const std::string& beneficiary, 
                                     double fundraisingGoal)
    : Event(id, title, description, date, location, coordinatorId, fraternity),
      beneficiary(beneficiary), fundraisingGoal(fundraisingGoal) {}


json PhilanthropyEvent::toJson() const {
    json j = Event::toJson();
    j["beneficiary"] = beneficiary;
    j["fundraisingGoal"] = fundraisingGoal;
    return j;
}

void PhilanthropyEvent::fromJson(const json& j) {
    Event::fromJson(j);
    beneficiary = j.value("beneficiary", "");
    fundraisingGoal = j.value("fundraisingGoal", 0.0);
}

bool PhilanthropyEvent::isValid() const {
    return Event::isValid() && !beneficiary.empty() && fundraisingGoal > 0;
}

std::shared_ptr<Event> PhilanthropyEvent::clone() const {
    return std::make_shared<PhilanthropyEvent>(*this);
}