/**
 * @file RecruitmentEvent.cpp
 * Recruitment/rush event subtype: formal rush flag layered on the base Event.
 */
#include "RecruitmentEvent.h"
#include <algorithm>
#include <sstream>

using json = nlohmann::json;

RecruitmentEvent::RecruitmentEvent() 
    : Event(), isFormalRush(false) {}

RecruitmentEvent::RecruitmentEvent(const std::string& id, const std::string& title,
                                   const std::string& description, std::time_t date,
                                   const std::string& location, const std::string& coordinatorId,
                                   const std::string& fraternity, bool isFormalRush)
    : Event(id, title, description, date, location, coordinatorId, fraternity),
      isFormalRush(isFormalRush) {}


json RecruitmentEvent::toJson() const {
    json j = Event::toJson();
    j["isFormalRush"] = isFormalRush;
    return j;
}

void RecruitmentEvent::fromJson(const json& j) {
    Event::fromJson(j);
    isFormalRush = j.value("isFormalRush", isFormalRush);

}

/*
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
*/

bool RecruitmentEvent::isValid() const {
    return Event::isValid();
}

std::shared_ptr<Event> RecruitmentEvent::clone() const {
    return std::make_shared<RecruitmentEvent>(*this);
}