#ifndef SOCIAL_EVENT_H
#define SOCIAL_EVENT_H

#include "Event.h"

/**
 * @file SocialEvent.h
 * Social event subtype: formal dress, alcohol policy, and venue capacity.
 */
class SocialEvent : public Event {
private:
    bool isFormal;
    bool hasAlcohol;
    int maxCapacity;

public:
    SocialEvent();
    SocialEvent(const std::string& id, const std::string& title,
                const std::string& description, std::time_t date,
                const std::string& location, const std::string& coordinatorId,
                const std::string& fraternity, bool isFormal, int maxCapacity);

    bool getIsFormal() const { return isFormal; }
    bool getHasAlcohol() const { return hasAlcohol; }
    int getMaxCapacity() const { return maxCapacity; }

    void setIsFormal(bool formal) { isFormal = formal; }
    void setHasAlcohol(bool alcohol) { hasAlcohol = alcohol; }
    void setMaxCapacity(int capacity) { maxCapacity = capacity; }

    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Social"; }
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif  // SOCIAL_EVENT_H
