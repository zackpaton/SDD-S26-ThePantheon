#ifndef EVENT_MANAGER_H
#define EVENT_MANAGER_H

#include "Event.h"
#include "RecruitmentEvent.h"
#include "PhilanthropyEvent.h"
#include "SocialEvent.h"
#include <map>
#include <vector>
#include <memory>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

/**
 * OOP PRINCIPLE: COMPOSITION & ENCAPSULATION
 * 
 * EventManager contains and manages Event objects (HAS-A relationship).
 * It encapsulates all event management logic and provides a clean interface.
 * 
 * Example: The internal map structure is hidden; external code can only
 * interact through public methods like addEvent(), getEvent(), etc.
 */
class EventManager {
private:
    std::map<std::string, std::shared_ptr<Event>> events;
    
    // Helper method to create appropriate event type from JSON
    std::shared_ptr<Event> createEventFromJson(const json& j);

public:
    EventManager();
    ~EventManager();
    
    // CRUD operations
    bool addEvent(std::shared_ptr<Event> event);
    bool removeEvent(const std::string& eventId);
    bool updateEvent(std::shared_ptr<Event> event);
    std::shared_ptr<Event> getEvent(const std::string& eventId) const;
    std::vector<std::shared_ptr<Event>> getAllEvents() const;
    
    // Type-specific getters (demonstrates polymorphism)
    std::vector<std::shared_ptr<RecruitmentEvent>> getRecruitmentEvents() const;
    std::vector<std::shared_ptr<PhilanthropyEvent>> getPhilanthropyEvents() const;
    std::vector<std::shared_ptr<SocialEvent>> getSocialEvents() const;
    
    // Filtering methods
    std::vector<std::shared_ptr<Event>> getEventsByDateRange(std::time_t start, std::time_t end) const;
    std::vector<std::shared_ptr<Event>> getEventsByLocation(const std::string& location) const;
    std::vector<std::shared_ptr<Event>> getEventsByCoordinator(const std::string& coordinatorId) const;
    std::vector<std::shared_ptr<Event>> getPublicEvents() const;
    std::vector<std::shared_ptr<Event>> getUpcomingEvents() const;
    
    // Recruitment-specific queries
    std::vector<std::shared_ptr<RecruitmentEvent>> getEventsByRushRound(const std::string& round) const;
    std::vector<std::shared_ptr<RecruitmentEvent>> getEventsForPNM(const std::string& pnmId) const;
    
    // Philanthropy-specific queries
    double getTotalFundsRaised() const;
    int getTotalVolunteerHours() const;
    std::vector<std::shared_ptr<PhilanthropyEvent>> getActivePhilanthropyEvents() const;
    
    // Social-specific queries
    std::vector<std::shared_ptr<SocialEvent>> getFormalEvents() const;
    std::vector<std::shared_ptr<SocialEvent>> getAvailableTicketEvents() const;
    
    // Statistics
    int getEventCount() const { return events.size(); }
    int getEventCountByType(const std::string& type) const;
    std::map<std::string, int> getEventStatistics() const;
    
    // Validation
    bool validateEvent(const Event& event) const;
    std::vector<std::string> getValidationErrors(const Event& event) const;
    
    // JSON serialization
    json toJson() const;
    void fromJson(const json& j);
    void clear();
};

#endif // EVENT_MANAGER_H