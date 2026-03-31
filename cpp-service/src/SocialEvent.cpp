#include "SocialEvent.h"
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <iostream>

SocialEvent::SocialEvent()
    : Event(), theme(""), isFormal(false), requiresTicket(false),
      ticketPrice(0.0), ticketsSold(0), maxCapacity(0), venue(""),
      hasAlcohol(false), partnerSorority(""), transportationInfo("") {}

SocialEvent::SocialEvent(const std::string& id, const std::string& title,
                         const std::string& description, std::time_t date,
                         const std::string& location, const std::string& coordinatorId,
                         const std::string& theme, bool isFormal)
    : Event(id, title, description, date, location, coordinatorId),
      theme(theme), isFormal(isFormal), requiresTicket(false),
      ticketPrice(0.0), ticketsSold(0), maxCapacity(0), venue(location),
      hasAlcohol(false), partnerSorority(""), transportationInfo("") {
    setIsPublic(false);  // Social events typically members-only
}

bool SocialEvent::sellTicket() {
    if (requiresTicket && ticketsSold < maxCapacity) {
        ticketsSold++;
        return true;
    }
    return false;
}

bool SocialEvent::refundTicket() {
    if (ticketsSold > 0) {
        ticketsSold--;
        return true;
    }
    return false;
}

int SocialEvent::getAvailableTickets() const {
    if (!requiresTicket) return -1;  // Not applicable
    return maxCapacity - ticketsSold;
}

double SocialEvent::getTotalRevenue() const {
    return ticketsSold * ticketPrice;
}

bool SocialEvent::isSoldOut() const {
    return requiresTicket && ticketsSold >= maxCapacity;
}

void SocialEvent::addActivity(const std::string& activity) {
    if (std::find(plannedActivities.begin(), plannedActivities.end(), activity) 
        == plannedActivities.end()) {
        plannedActivities.push_back(activity);
    }
}

void SocialEvent::removeActivity(const std::string& activity) {
    plannedActivities.erase(
        std::remove(plannedActivities.begin(), plannedActivities.end(), activity),
        plannedActivities.end()
    );
}

json SocialEvent::toJson() const {
    json j = Event::toJson();
    j["theme"] = theme;
    j["isFormal"] = isFormal;
    j["requiresTicket"] = requiresTicket;
    j["ticketPrice"] = ticketPrice;
    j["ticketsSold"] = ticketsSold;
    j["maxCapacity"] = maxCapacity;
    j["venue"] = venue;
    j["hasAlcohol"] = hasAlcohol;
    j["partnerSorority"] = partnerSorority;
    j["plannedActivities"] = plannedActivities;
    j["transportationInfo"] = transportationInfo;
    return j;
}

void SocialEvent::fromJson(const json& j) {
    //std::cout<<"hereSocialfromJson"<<std::endl;
    //std::cout<<j<<std::endl;
    Event::fromJson(j);
    theme = j.value("theme", "");
    isFormal = j.value("isFormal", false);
    requiresTicket = j.value("requiresTicket", false);
    ticketPrice = j.value("ticketPrice", 0.0);
    ticketsSold = j.value("ticketsSold", 0);
    maxCapacity = j.value("maxCapacity", 0);
    venue = j.value("venue", "");
    hasAlcohol = j.value("hasAlcohol", false);
    partnerSorority = j.value("partnerSorority", "");
    transportationInfo = j.value("transportationInfo", "");
    
    if (j.contains("plannedActivities")) {
        plannedActivities = j["plannedActivities"].get<std::vector<std::string>>();
    }
}

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

bool SocialEvent::isValid() const {
    bool valid = Event::isValid() && !theme.empty();
    if (requiresTicket) {
        valid = valid && ticketPrice >= 0 && maxCapacity > 0;
    }
    return valid;
}

std::shared_ptr<Event> SocialEvent::clone() const {
    return std::make_shared<SocialEvent>(*this);
}