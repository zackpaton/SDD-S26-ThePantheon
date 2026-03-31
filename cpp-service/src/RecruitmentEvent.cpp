#include "RecruitmentEvent.h"
#include <algorithm>
#include <sstream>

RecruitmentEvent::RecruitmentEvent() 
    : Event(), rushRound(""), targetRecruits(0), requiresRSVP(false), 
      dresscode("Casual"), isFormalRush(false) {}

RecruitmentEvent::RecruitmentEvent(const std::string& id, const std::string& title,
                                   const std::string& description, std::time_t date,
                                   const std::string& location, const std::string& coordinatorId,
                                   const std::string& rushRound)
    : Event(id, title, description, date, location, coordinatorId),
      rushRound(rushRound), targetRecruits(0), requiresRSVP(false),
      dresscode("Casual"), isFormalRush(false) {
    setIsPublic(true);  // Recruitment events are typically public
}

void RecruitmentEvent::invitePNM(const std::string& pnmId) {
    if (!isPNMInvited(pnmId)) {
        pnmInviteList.push_back(pnmId);
    }
}

void RecruitmentEvent::removePNMInvite(const std::string& pnmId) {
    pnmInviteList.erase(
        std::remove(pnmInviteList.begin(), pnmInviteList.end(), pnmId),
        pnmInviteList.end()
    );
}

void RecruitmentEvent::recordPNMAttendance(const std::string& pnmId) {
    if (isPNMInvited(pnmId) && 
        std::find(pnmAttendees.begin(), pnmAttendees.end(), pnmId) == pnmAttendees.end()) {
        pnmAttendees.push_back(pnmId);
    }
}

bool RecruitmentEvent::isPNMInvited(const std::string& pnmId) const {
    return std::find(pnmInviteList.begin(), pnmInviteList.end(), pnmId) != pnmInviteList.end();
}

double RecruitmentEvent::getPNMAttendanceRate() const {
    if (pnmInviteList.empty()) return 0.0;
    return (static_cast<double>(pnmAttendees.size()) / pnmInviteList.size()) * 100.0;
}

json RecruitmentEvent::toJson() const {
    json j = Event::toJson();
    j["rushRound"] = rushRound;
    j["targetRecruits"] = targetRecruits;
    j["requiresRSVP"] = requiresRSVP;
    j["dresscode"] = dresscode;
    j["isFormalRush"] = isFormalRush;
    j["pnmInviteList"] = pnmInviteList;
    j["pnmAttendees"] = pnmAttendees;
    return j;
}

void RecruitmentEvent::fromJson(const json& j) {
    Event::fromJson(j);
    rushRound = j.value("rushRound", "");
    targetRecruits = j.value("targetRecruits", 0);
    requiresRSVP = j.value("requiresRSVP", false);
    dresscode = j.value("dresscode", "Casual");
    isFormalRush = j.value("isFormalRush", false);
    
    if (j.contains("pnmInviteList")) {
        pnmInviteList = j["pnmInviteList"].get<std::vector<std::string>>();
    }
    if (j.contains("pnmAttendees")) {
        pnmAttendees = j["pnmAttendees"].get<std::vector<std::string>>();
    }
}

std::string RecruitmentEvent::getEventDetails() const {
    std::stringstream ss;
    ss << Event::getEventDetails();
    ss << "\n  Rush Round: " << rushRound;
    ss << "\n  Target Recruits: " << targetRecruits;
    ss << "\n  PNM Attendance: " << getPNMAttendanceCount() << "/" << pnmInviteList.size();
    ss << " (" << getPNMAttendanceRate() << "%)";
    ss << "\n  Dress Code: " << dresscode;
    if (requiresRSVP) ss << "\n  RSVP Required";
    return ss.str();
}

bool RecruitmentEvent::isValid() const {
    return Event::isValid() && !rushRound.empty() && targetRecruits > 0;
}

std::shared_ptr<Event> RecruitmentEvent::clone() const {
    return std::make_shared<RecruitmentEvent>(*this);
}