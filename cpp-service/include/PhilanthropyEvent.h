#ifndef PHILANTHROPY_EVENT_H
#define PHILANTHROPY_EVENT_H

#include "Event.h"

/**
 * @file PhilanthropyEvent.h
 * Philanthropy event subtype: beneficiary organization and fundraising goal.
 */
class PhilanthropyEvent : public Event {
private:
    std::string beneficiary;
    double fundraisingGoal;

public:
    PhilanthropyEvent();
    PhilanthropyEvent(const std::string& id, const std::string& title,
                      const std::string& description, std::time_t date,
                      const std::string& location, const std::string& coordinatorId, const std::string& fraternity,
                      const std::string& beneficiary, double fundraisingGoal);

    std::string getBeneficiary() const { return beneficiary; }
    double getFundraisingGoal() const { return fundraisingGoal; }

    void setBeneficiary(const std::string& ben) { beneficiary = ben; }
    void setFundraisingGoal(double goal) { fundraisingGoal = goal; }

    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Philanthropy"; }
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif  // PHILANTHROPY_EVENT_H
