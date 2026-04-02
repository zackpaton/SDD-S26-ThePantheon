#ifndef PHILANTHROPY_EVENT_H
#define PHILANTHROPY_EVENT_H

#include "Event.h"

/**
 * OOP PRINCIPLE: INHERITANCE
 * 
 * PhilanthropyEvent inherits from Event for charity and service events.
 * 
 * Example: Fundraisers, charity walks, community service projects
 */
class PhilanthropyEvent : public Event {
private:
    std::string beneficiary;  // Organization or cause being supported
    double fundraisingGoal;
    
    
public:
    PhilanthropyEvent();
    PhilanthropyEvent(const std::string& id, const std::string& title,
                      const std::string& description, std::time_t date,
                      const std::string& location, const std::string& coordinatorId, const std::string& fraternity,
                      const std::string& beneficiary, double fundraisingGoal);
    
    // Getters
    std::string getBeneficiary() const { return beneficiary; }
    double getFundraisingGoal() const { return fundraisingGoal; }
    
    // Setters
    void setBeneficiary(const std::string& ben) { beneficiary = ben; }
    void setFundraisingGoal(double goal) { fundraisingGoal = goal; }
    
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods for philanthropy-specific behavior
     */
    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    std::string getEventType() const override { return "Philanthropy"; }
    // std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // PHILANTHROPY_EVENT_H