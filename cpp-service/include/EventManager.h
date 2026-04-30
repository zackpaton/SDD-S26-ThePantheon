#ifndef EVENT_MANAGER_H
#define EVENT_MANAGER_H

#include "Event.h"
#include "RecruitmentEvent.h"
#include "PhilanthropyEvent.h"
#include "SocialEvent.h"
#include <map>
#include <vector>
#include <memory>
#include "nlohmann_json_include.hpp"

/**
 * @file EventManager.h
 * In-memory map of events by id: CRUD, polymorphic queries by type, filters, validation, and JSON bulk load/export.
 */
class EventManager {
private:
    std::map<std::string, std::shared_ptr<Event>> events;

    static std::shared_ptr<Event> createEventFromJson(const nlohmann::json& j);

public:
    EventManager();
    ~EventManager();

    bool addEvent(const std::shared_ptr<Event>& event);
    bool removeEvent(const std::string& eventId);
    bool updateEvent(const std::shared_ptr<Event>& event);
    std::shared_ptr<Event> getEvent(const std::string& eventId) const;
    std::vector<std::shared_ptr<Event>> getAllEvents() const;

    std::vector<std::shared_ptr<RecruitmentEvent>> getRecruitmentEvents() const;
    std::vector<std::shared_ptr<PhilanthropyEvent>> getPhilanthropyEvents() const;
    std::vector<std::shared_ptr<SocialEvent>> getSocialEvents() const;

    std::vector<std::shared_ptr<Event>> getEventsByDateRange(std::time_t start, std::time_t end) const;
    std::vector<std::shared_ptr<Event>> getEventsByLocation(const std::string& location) const;
    std::vector<std::shared_ptr<Event>> getEventsByCoordinator(const std::string& coordinatorId) const;
    std::vector<std::shared_ptr<Event>> getUpcomingEvents() const;

    std::vector<std::shared_ptr<RecruitmentEvent>> getEventsByRushRound(const std::string& round) const;
    std::vector<std::shared_ptr<RecruitmentEvent>> getEventsForPNM(const std::string& pnmId) const;

    double getTotalFundsRaised() const;
    int getTotalVolunteerHours() const;
    std::vector<std::shared_ptr<PhilanthropyEvent>> getActivePhilanthropyEvents() const;

    std::vector<std::shared_ptr<SocialEvent>> getFormalEvents() const;

    int getEventCount() const { return static_cast<int>(events.size()); }
    int getEventCountByType(const std::string& type) const;
    std::map<std::string, int> getEventStatistics() const;

    static bool validateEvent(const Event& event);
    static std::vector<std::string> getValidationErrors(const Event& event);

    nlohmann::json toJson() const;
    void fromJson(const nlohmann::json& j);
    void clear();
};

#endif  // EVENT_MANAGER_H
