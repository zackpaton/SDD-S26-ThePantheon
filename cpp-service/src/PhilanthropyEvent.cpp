#include "PhilanthropyEvent.h"
#include <sstream>
#include <iomanip>

using json = nlohmann::json;

PhilanthropyEvent::PhilanthropyEvent()
    : Event(), beneficiary(""), fundraisingGoal(0.0) {}

PhilanthropyEvent::PhilanthropyEvent(const std::string& id, const std::string& title,
                                     const std::string& description, std::time_t date,
                                     const std::string& location, const std::string& coordinatorId,
                                     const std::string& beneficiary, double fundraisingGoal)
    : Event(id, title, description, date, location, coordinatorId),
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

/*
std::string PhilanthropyEvent::getEventDetails() const {
    std::stringstream ss;
    ss << Event::getEventDetails();
    ss << "\n  Beneficiary: " << beneficiary;
    ss << "\n  Fundraising: $" << std::fixed << std::setprecision(2) 
       << currentFunds << " / $" << fundraisingGoal 
       << " (" << getFundraisingProgress() << "%)";
    ss << "\n  Volunteer Hours: " << volunteerHoursCompleted 
       << " / " << volunteerHoursGoal 
       << " (" << getVolunteerProgress() << "%)";
    if (!partnerOrganization.empty()) {
        ss << "\n  Partner: " << partnerOrganization;
    }
    if (!sponsors.empty()) {
        ss << "\n  Sponsors: " << sponsors.size();
    }
    return ss.str();
}
*/

bool PhilanthropyEvent::isValid() const {
    return Event::isValid() && !beneficiary.empty() && fundraisingGoal > 0;
}

std::shared_ptr<Event> PhilanthropyEvent::clone() const {
    return std::make_shared<PhilanthropyEvent>(*this);
}