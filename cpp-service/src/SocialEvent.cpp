#include "SocialEvent.h"
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <iostream>

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
    //std::cout<<"hereSocialfromJson"<<std::endl;
    //std::cout<<j<<std::endl;
    Event::fromJson(j);
    isFormal = j.value("isFormal", false);
    hasAlcohol = j.value("hasAlcohol", false);
    maxCapacity = j.value("maxCapacity", 0);
}

/*
std::string SocialEvent::getEventDetails() const {
    std::stringstream ss;
    ss << Event::getEventDetails();
    ss << "\n  Theme: " << theme;
    if (isFormal) ss << " (Formal)";
    if (!venue.empty()) ss << "\n  Venue: " << venue;
    if (requiresTicket) {
        ss << "\n  Tickets: " << ticketsSold << " / " << maxCapacity;
        ss << " ($" << std::fixed << std::setprecision(2) << ticketPrice << " each)";
        ss << "\n  Revenue: $" << getTotalRevenue();
    }
    if (!partnerSorority.empty()) {
        ss << "\n  Partner: " << partnerSorority;
    }
    if (hasAlcohol) ss << "\n  21+ Event";
    if (!plannedActivities.empty()) {
        ss << "\n  Activities: " << plannedActivities.size();
    }
    return ss.str();
}
*/

bool SocialEvent::isValid() const {
    bool valid = Event::isValid() && maxCapacity > 0;
    return valid;
}

std::shared_ptr<Event> SocialEvent::clone() const {
    return std::make_shared<SocialEvent>(*this);
}