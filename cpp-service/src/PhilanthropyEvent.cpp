#include "PhilanthropyEvent.h"
#include <sstream>
#include <iomanip>

PhilanthropyEvent::PhilanthropyEvent()
    : Event(), beneficiary(""), fundraisingGoal(0.0), currentFunds(0.0),
      causeDescription(""), volunteerHoursGoal(0), volunteerHoursCompleted(0),
      isPublicService(false), partnerOrganization("") {}

PhilanthropyEvent::PhilanthropyEvent(const std::string& id, const std::string& title,
                                     const std::string& description, std::time_t date,
                                     const std::string& location, const std::string& coordinatorId,
                                     const std::string& beneficiary, double fundraisingGoal)
    : Event(id, title, description, date, location, coordinatorId),
      beneficiary(beneficiary), fundraisingGoal(fundraisingGoal), currentFunds(0.0),
      causeDescription(""), volunteerHoursGoal(0), volunteerHoursCompleted(0),
      isPublicService(true), partnerOrganization("") {}

void PhilanthropyEvent::addDonation(double amount) {
    if (amount > 0) {
        currentFunds += amount;
    }
}

void PhilanthropyEvent::addVolunteerHours(int hours) {
    if (hours > 0) {
        volunteerHoursCompleted += hours;
    }
}

double PhilanthropyEvent::getFundraisingProgress() const {
    if (fundraisingGoal <= 0) return 0.0;
    return (currentFunds / fundraisingGoal) * 100.0;
}

double PhilanthropyEvent::getVolunteerProgress() const {
    if (volunteerHoursGoal <= 0) return 0.0;
    return (static_cast<double>(volunteerHoursCompleted) / volunteerHoursGoal) * 100.0;
}

void PhilanthropyEvent::addSponsor(const std::string& sponsor) {
    if (std::find(sponsors.begin(), sponsors.end(), sponsor) == sponsors.end()) {
        sponsors.push_back(sponsor);
    }
}

json PhilanthropyEvent::toJson() const {
    json j = Event::toJson();
    j["beneficiary"] = beneficiary;
    j["fundraisingGoal"] = fundraisingGoal;
    j["currentFunds"] = currentFunds;
    j["causeDescription"] = causeDescription;
    j["volunteerHoursGoal"] = volunteerHoursGoal;
    j["volunteerHoursCompleted"] = volunteerHoursCompleted;
    j["isPublicService"] = isPublicService;
    j["partnerOrganization"] = partnerOrganization;
    j["sponsors"] = sponsors;
    return j;
}

void PhilanthropyEvent::fromJson(const json& j) {
    Event::fromJson(j);
    beneficiary = j.value("beneficiary", "");
    fundraisingGoal = j.value("fundraisingGoal", 0.0);
    currentFunds = j.value("currentFunds", 0.0);
    causeDescription = j.value("causeDescription", "");
    volunteerHoursGoal = j.value("volunteerHoursGoal", 0);
    volunteerHoursCompleted = j.value("volunteerHoursCompleted", 0);
    isPublicService = j.value("isPublicService", false);
    partnerOrganization = j.value("partnerOrganization", "");
    
    if (j.contains("sponsors")) {
        sponsors = j["sponsors"].get<std::vector<std::string>>();
    }
}

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

bool PhilanthropyEvent::isValid() const {
    return Event::isValid() && !beneficiary.empty() && fundraisingGoal > 0;
}

std::shared_ptr<Event> PhilanthropyEvent::clone() const {
    return std::make_shared<PhilanthropyEvent>(*this);
}