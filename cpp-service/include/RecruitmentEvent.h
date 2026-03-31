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
    std::string rushRound;  // "Meet the Brothers", "Philanthropy Night", "Preference Round"
    int targetRecruits;
    bool requiresRSVP;
    std::string dresscode;
    std::vector<std::string> pnmInviteList;  // Potential New Member invite list
    std::vector<std::string> pnmAttendees;   // PNMs who actually attended
    bool isFormalRush;

public:
    RecruitmentEvent();
    RecruitmentEvent(const std::string& id, const std::string& title, 
                     const std::string& description, std::time_t date,
                     const std::string& location, const std::string& coordinatorId,
                     const std::string& rushRound);
    
    // Getters
    std::string getRushRound() const { return rushRound; }
    int getTargetRecruits() const { return targetRecruits; }
    bool getRequiresRSVP() const { return requiresRSVP; }
    std::string getDresscode() const { return dresscode; }
    std::vector<std::string> getPnmInviteList() const { return pnmInviteList; }
    std::vector<std::string> getPnmAttendees() const { return pnmAttendees; }
    bool getIsFormalRush() const { return isFormalRush; }
    
    // Setters
    void setRushRound(const std::string& round) { rushRound = round; }
    void setTargetRecruits(int target) { targetRecruits = target; }
    void setRequiresRSVP(bool rsvp) { requiresRSVP = rsvp; }
    void setDresscode(const std::string& code) { dresscode = code; }
    void setIsFormalRush(bool formal) { isFormalRush = formal; }
    
    // PNM management
    void invitePNM(const std::string& pnmId);
    void removePNMInvite(const std::string& pnmId);
    void recordPNMAttendance(const std::string& pnmId);
    bool isPNMInvited(const std::string& pnmId) const;
    int getPNMAttendanceCount() const { return pnmAttendees.size(); }
    double getPNMAttendanceRate() const;
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods to provide recruitment-specific behavior
     */
    json toJson() const override;
    void fromJson(const json& j) override;
    std::string getEventType() const override { return "Recruitment"; }
    std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // RECRUITMENT_EVENT_H