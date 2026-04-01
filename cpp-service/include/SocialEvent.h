#ifndef SOCIAL_EVENT_H
#define SOCIAL_EVENT_H

#include "Event.h"

/**
 * OOP PRINCIPLE: INHERITANCE
 * 
 * SocialEvent inherits from Event for brotherhood and social activities.
 * 
 * Example: Formals, mixers, brotherhood retreats, game nights
 */
class SocialEvent : public Event {
private:
    bool isFormal;
    bool hasAlcohol;  // 21+ restriction
    int maxCapacity;
    
public:
    SocialEvent();
    SocialEvent(const std::string& id, const std::string& title,
                const std::string& description, std::time_t date,
                const std::string& location, const std::string& coordinatorId,
                bool isFormal, int maxCapacity);
    
    // Getters
    bool getIsFormal() const { return isFormal; }
    bool getHasAlcohol() const { return hasAlcohol; }
    int getMaxCapacity() const { return maxCapacity; }
    
    // Setters
    void setIsFormal(bool formal) { isFormal = formal; }
    void setHasAlcohol(bool alcohol) { hasAlcohol = alcohol; }
    void setMaxCapacity(int capacity) { maxCapacity = capacity; }

    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods for social event-specific behavior
     */
    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Social"; }
    // std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // SOCIAL_EVENT_H