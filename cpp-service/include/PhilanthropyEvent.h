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
    double currentFunds;
    std::string causeDescription;
    int volunteerHoursGoal;
    int volunteerHoursCompleted;
    bool isPublicService;  // Open to public participation
    std::string partnerOrganization;
    std::vector<std::string> sponsors;
    
public:
    PhilanthropyEvent();
    PhilanthropyEvent(const std::string& id, const std::string& title,
                      const std::string& description, std::time_t date,
                      const std::string& location, const std::string& coordinatorId,
                      const std::string& beneficiary, double fundraisingGoal);
    
    // Getters
    std::string getBeneficiary() const { return beneficiary; }
    double getFundraisingGoal() const { return fundraisingGoal; }
    double getCurrentFunds() const { return currentFunds; }
    std::string getCauseDescription() const { return causeDescription; }
    int getVolunteerHoursGoal() const { return volunteerHoursGoal; }
    int getVolunteerHoursCompleted() const { return volunteerHoursCompleted; }
    bool getIsPublicService() const { return isPublicService; }
    std::string getPartnerOrganization() const { return partnerOrganization; }
    std::vector<std::string> getSponsors() const { return sponsors; }
    
    // Setters
    void setBeneficiary(const std::string& ben) { beneficiary = ben; }
    void setFundraisingGoal(double goal) { fundraisingGoal = goal; }
    void setCauseDescription(const std::string& desc) { causeDescription = desc; }
    void setVolunteerHoursGoal(int hours) { volunteerHoursGoal = hours; }
    void setIsPublicService(bool isPublic) { isPublicService = isPublic; }
    void setPartnerOrganization(const std::string& org) { partnerOrganization = org; }
    
    // Fundraising operations
    void addDonation(double amount);
    void addVolunteerHours(int hours);
    double getFundraisingProgress() const;  // Percentage
    double getVolunteerProgress() const;    // Percentage
    void addSponsor(const std::string& sponsor);
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods for philanthropy-specific behavior
     */
    json toJson() const override;
    void fromJson(const json& j) override;
    std::string getEventType() const override { return "Philanthropy"; }
    std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // PHILANTHROPY_EVENT_H