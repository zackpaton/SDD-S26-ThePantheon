#ifndef RECRUITMENT_EVENT_H
#define RECRUITMENT_EVENT_H

#include "Event.h"

/**
 * @file RecruitmentEvent.h
 * Recruitment/rush event subtype: optional formal-rush flag on top of the base Event.
 */
class RecruitmentEvent : public Event {
private:
    bool isFormalRush;

public:
    RecruitmentEvent();
    RecruitmentEvent(const std::string& id, const std::string& title,
                     const std::string& description, std::time_t date,
                     const std::string& location, const std::string& coordinatorId,
                     const std::string& fraternity, bool isFormalRush);

    bool getIsFormalRush() const { return isFormalRush; }

    void setIsFormalRush(bool formal) { isFormalRush = formal; }

    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Recruitment"; }
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif  // RECRUITMENT_EVENT_H
