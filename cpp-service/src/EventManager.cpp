#include "EventManager.h"
#include <algorithm>
#include <ctime>
#include <stdio.h>
#include <string.h>
#include <iostream>

using json = nlohmann::json;

EventManager::EventManager() {}

EventManager::~EventManager() {
    clear();
}

std::shared_ptr<Event> EventManager::createEventFromJson(const json& j) {
    std::string eventType = j.value("eventType", "General");
    std::shared_ptr<Event> event;
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Factory pattern - create appropriate derived class based on type
     */
    if (eventType == "Recruitment") {
        event = std::make_shared<RecruitmentEvent>();
    } else if (eventType == "Philanthropy") {
        event = std::make_shared<PhilanthropyEvent>();
    } else if (eventType == "Social") {
        event = std::make_shared<SocialEvent>();
    } else {
        event = std::make_shared<Event>();
    }
    
    event->fromJson(j);
    return event;
}

bool EventManager::addEvent(std::shared_ptr<Event> event) {
    if (!event || !event->isValid()) {
        return false;
    }
    
    events[event->getId()] = event;
    return true;
}

bool EventManager::removeEvent(const std::string& eventId) {
    return events.erase(eventId) > 0;
}

bool EventManager::updateEvent(std::shared_ptr<Event> event) {
    if (!event || !event->isValid()) {
        return false;
    }
    
    auto it = events.find(event->getId());
    if (it == events.end()) {
        return false;
    }
    
    events[event->getId()] = event;
    return true;
}

std::shared_ptr<Event> EventManager::getEvent(const std::string& eventId) const {
    auto it = events.find(eventId);
    if (it != events.end()) {
        return it->second;
    }
    return nullptr;
}

std::vector<std::shared_ptr<Event>> EventManager::getAllEvents() const {
    std::vector<std::shared_ptr<Event>> result;
    for (const auto& pair : events) {
        result.push_back(pair.second);
    }
    return result;
}

/**
 * OOP PRINCIPLE: POLYMORPHISM
 * Dynamic casting to retrieve specific event types
 */
std::vector<std::shared_ptr<RecruitmentEvent>> EventManager::getRecruitmentEvents() const {
    std::vector<std::shared_ptr<RecruitmentEvent>> result;
    for (const auto& pair : events) {
        auto recruitEvent = std::dynamic_pointer_cast<RecruitmentEvent>(pair.second);
        if (recruitEvent) {
            result.push_back(recruitEvent);
        }
    }
    return result;
}

std::vector<std::shared_ptr<PhilanthropyEvent>> EventManager::getPhilanthropyEvents() const {
    std::vector<std::shared_ptr<PhilanthropyEvent>> result;
    for (const auto& pair : events) {
        auto philEvent = std::dynamic_pointer_cast<PhilanthropyEvent>(pair.second);
        if (philEvent) {
            result.push_back(philEvent);
        }
    }
    return result;
}

std::vector<std::shared_ptr<SocialEvent>> EventManager::getSocialEvents() const {
    std::vector<std::shared_ptr<SocialEvent>> result;
    for (const auto& pair : events) {
        auto socialEvent = std::dynamic_pointer_cast<SocialEvent>(pair.second);
        if (socialEvent) {
            result.push_back(socialEvent);
        }
    }
    return result;
}

std::vector<std::shared_ptr<Event>> EventManager::getEventsByDateRange(
    std::time_t start, std::time_t end) const {
    std::vector<std::shared_ptr<Event>> result;
    for (const auto& pair : events) {
        std::time_t eventDate = pair.second->getDate();
        if (eventDate >= start && eventDate <= end) {
            result.push_back(pair.second);
        }
    }
    return result;
}

std::vector<std::shared_ptr<Event>> EventManager::getEventsByLocation(
    const std::string& location) const {
    std::vector<std::shared_ptr<Event>> result;
    for (const auto& pair : events) {
        if (pair.second->getLocation() == location) {
            result.push_back(pair.second);
        }
    }
    return result;
}

std::vector<std::shared_ptr<Event>> EventManager::getEventsByCoordinator(
    const std::string& coordinatorId) const {
    std::vector<std::shared_ptr<Event>> result;
    for (const auto& pair : events) {
        if (pair.second->getCoordinatorId() == coordinatorId) {
            result.push_back(pair.second);
        }
    }
    return result;
}


/*
std::vector<std::shared_ptr<Event>> EventManager::getPublicEvents() const {
    std::vector<std::shared_ptr<Event>> result;
    for (const auto& pair : events) {
        if (pair.second->getIsPublic()) {
            result.push_back(pair.second);
        }
    }
    return result;
}

*/

std::vector<std::shared_ptr<Event>> EventManager::getUpcomingEvents() const {
    std::time_t now = std::time(nullptr);
    std::vector<std::shared_ptr<Event>> result;
    
    for (const auto& pair : events) {
        if (pair.second->getDate() >= now) {
            result.push_back(pair.second);
        }
    }
    
    // Sort by date
    std::sort(result.begin(), result.end(),
        [](const std::shared_ptr<Event>& a, const std::shared_ptr<Event>& b) {
            return a->getDate() < b->getDate();
        });
    
    return result;
}

/*
std::vector<std::shared_ptr<RecruitmentEvent>> EventManager::getEventsByRushRound(
    const std::string& round) const {
    std::vector<std::shared_ptr<RecruitmentEvent>> result;
    auto recruitEvents = getRecruitmentEvents();
    
    for (const auto& event : recruitEvents) {
        if (event->getRushRound() == round) {
            result.push_back(event);
        }
    }
    return result;
}


std::vector<std::shared_ptr<RecruitmentEvent>> EventManager::getEventsForPNM(
    const std::string& pnmId) const {
    std::vector<std::shared_ptr<RecruitmentEvent>> result;
    auto recruitEvents = getRecruitmentEvents();
    
    for (const auto& event : recruitEvents) {
        if (event->isPNMInvited(pnmId)) {
            result.push_back(event);
        }
    }
    return result;
}

double EventManager::getTotalFundsRaised() const {
    double total = 0.0;
    auto philEvents = getPhilanthropyEvents();
    
    for (const auto& event : philEvents) {
        total += event->getCurrentFunds();
    }
    return total;
}

int EventManager::getTotalVolunteerHours() const {
    int total = 0;
    auto philEvents = getPhilanthropyEvents();
    
    for (const auto& event : philEvents) {
        total += event->getVolunteerHoursCompleted();
    }
    return total;
}

std::vector<std::shared_ptr<PhilanthropyEvent>> EventManager::getActivePhilanthropyEvents() const {
    std::vector<std::shared_ptr<PhilanthropyEvent>> result;
    auto philEvents = getPhilanthropyEvents();
    std::time_t now = std::time(nullptr);
    
    for (const auto& event : philEvents) {
        if (event->getDate() >= now && event->getCurrentFunds() < event->getFundraisingGoal()) {
            result.push_back(event);
        }
    }
    return result;
}
*/

std::vector<std::shared_ptr<SocialEvent>> EventManager::getFormalEvents() const {
    std::vector<std::shared_ptr<SocialEvent>> result;
    auto socialEvents = getSocialEvents();
    
    for (const auto& event : socialEvents) {
        if (event->getIsFormal()) {
            result.push_back(event);
        }
    }
    return result;
}

/*
std::vector<std::shared_ptr<SocialEvent>> EventManager::getAvailableTicketEvents() const {
    std::vector<std::shared_ptr<SocialEvent>> result;
    auto socialEvents = getSocialEvents();
    
    for (const auto& event : socialEvents) {
        if (event->getRequiresTicket() && !event->isSoldOut()) {
            result.push_back(event);
        }
    }
    return result;
}
*/

int EventManager::getEventCountByType(const std::string& type) const {
    int count = 0;
    for (const auto& pair : events) {
        if (pair.second->getEventType() == type) {
            count++;
        }
    }
    return count;
}

std::map<std::string, int> EventManager::getEventStatistics() const {
    std::map<std::string, int> stats;
    stats["Total"] = events.size();
    stats["Recruitment"] = getEventCountByType("Recruitment");
    stats["Philanthropy"] = getEventCountByType("Philanthropy");
    stats["Social"] = getEventCountByType("Social");
    stats["General"] = getEventCountByType("General");
    return stats;
}

bool EventManager::validateEvent(const Event& event) const {
    return event.isValid();
}

std::vector<std::string> EventManager::getValidationErrors(const Event& event) const {
    std::vector<std::string> errors;
    
    if (event.getId().empty()) {
        errors.push_back("Event ID is required");
    }
    if (event.getTitle().empty()) {
        errors.push_back("Event title is required");
    }
    if (event.getDate() <= 0) {
        errors.push_back("Valid event date is required");
    }
    if (event.getCoordinatorId().empty()) {
        errors.push_back("Event coordinator is required");
    }
    
    // Type-specific validation
    /*
    if (auto recruitEvent = dynamic_cast<const RecruitmentEvent*>(&event)) {
        if (recruitEvent->getRushRound().empty()) {
            errors.push_back("Rush round is required for recruitment events");
        }
        if (recruitEvent->getTargetRecruits() <= 0) {
            errors.push_back("Target recruits must be greater than 0");
        }
    } else if (auto philEvent = dynamic_cast<const PhilanthropyEvent*>(&event)) {
        if (philEvent->getBeneficiary().empty()) {
            errors.push_back("Beneficiary is required for philanthropy events");
        }
        if (philEvent->getFundraisingGoal() <= 0) {
            errors.push_back("Fundraising goal must be greater than 0");
        }
    } else if (auto socialEvent = dynamic_cast<const SocialEvent*>(&event)) {
        if (socialEvent->getTheme().empty()) {
            errors.push_back("Theme is required for social events");
        }
        if (socialEvent->getRequiresTicket() && socialEvent->getMaxCapacity() <= 0) {
            errors.push_back("Max capacity required for ticketed events");
        }
    }
    */
    
    return errors;
}

json EventManager::toJson() const {
    
    json j = json::array();
    
    for (const auto& pair : events) {
        j.push_back(pair.second->toJson());
    }
    
    return j;
}

void EventManager::fromJson(const json& j) {
    clear();
    if (j.is_array()) {
        for (const auto& eventJson : j) {


            auto event = createEventFromJson(eventJson);

            std::cerr<<event->isValid()<<std::endl;

            if (event && event->isValid()) {
                events[event->getId()] = event;
            }
        }
    }

}

void EventManager::clear() {
    events.clear();
}