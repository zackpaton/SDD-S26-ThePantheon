#ifndef RECRUITMENT_EVENT_H
#define RECRUITMENT_EVENT_H

#include "Event.h"

/**
 * OOP PRINCIPLE: INHERITANCE
 * 
 * RecruitmentEvent inherits from Event, gaining all its properties
 * and methods, while adding recruitment-specific functionality.
 * 
 * This represents an "IS-A" relationship: A RecruitmentEvent IS-A Event.
 * 
 * Example: Rush events, meet-and-greets, information sessions
 */
class RecruitmentEvent : public Event {
private:
    bool isFormalRush;

public:
    RecruitmentEvent();
    RecruitmentEvent(const std::string& id, const std::string& title, 
                     const std::string& description, std::time_t date,
                     const std::string& location, const std::string& coordinatorId,
                     bool isFormalRush);
    
    // Getters
    bool getIsFormalRush() const { return isFormalRush; }
    
    // Setters
    void setIsFormalRush(bool formal) { isFormalRush = formal; }

    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods to provide recruitment-specific behavior
     */
    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Recruitment"; }
    // std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // RECRUITMENT_EVENT_H