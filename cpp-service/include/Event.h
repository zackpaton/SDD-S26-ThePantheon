#ifndef EVENT_H
#define EVENT_H

#include <string>
#include <ctime>
#include <memory>
#include <vector>
#include <nlohmann/json.hpp>

/**
 * @file Event.h
 * Base calendar event: core fields, attendee and notification id lists, JSON I/O, and polymorphic clone/type tag.
 */
class Event {
protected:
    std::string id;
    std::string title;
    std::string description;
    std::time_t date;
    std::time_t startTime;
    std::time_t endTime;
    std::string location;
    std::string coordinatorId;
    std::string fraternity;
    std::vector<std::string> attendeeIds;
    std::vector<std::string> notificationAttendeeIds;
    std::vector<std::string> notifiedAttendeeIds;

public:
    Event();
    Event(const std::string& id, const std::string& title, const std::string& description,
          std::time_t date, const std::string& location, const std::string& coordinatorId, const std::string& fraternity);

    virtual ~Event() = default;

    std::string getId() const { return id; }
    std::string getTitle() const { return title; }
    std::string getDescription() const { return description; }
    std::time_t getDate() const { return date; }
    std::time_t getStartTime() const { return startTime; }
    std::time_t getEndTime() const { return endTime; }
    std::string getLocation() const { return location; }
    std::string getCoordinatorId() const { return coordinatorId; }
    std::string getFraternity() const { return fraternity; }
    std::vector<std::string> getAttendeeIds() const { return attendeeIds; }
    int getAttendeeCount() const { return static_cast<int>(attendeeIds.size()); }
    std::vector<std::string> getNotificationAttendeeIds() const { return notificationAttendeeIds; }
    std::vector<std::string> getNotifiedAttendeeIds() const { return notifiedAttendeeIds; }

    void setTitle(const std::string& t) { title = t; }
    void setDescription(const std::string& desc) { description = desc; }
    void setDate(std::time_t d) { date = d; }
    void setStartTime(std::time_t st) { startTime = st; }
    void setEndTime(std::time_t et) { endTime = et; }
    void setLocation(const std::string& loc) { location = loc; }
    void setCoordinatorId(const std::string& cId) { coordinatorId = cId; }
    void setFraternity(const std::string& frat) { fraternity = frat; }

    void addAttendee(const std::string& userId);
    void removeAttendee(const std::string& userId);
    void toggleNotification(const std::string& userId, bool enabled);
    void notificationSent(const std::string& userId);
    bool isAttending(const std::string& userId) const;

    virtual nlohmann::json toJson() const;
    virtual void fromJson(const nlohmann::json& j);
    virtual std::string getEventType() const { return "Other"; }
    virtual bool isValid() const;

    virtual std::shared_ptr<Event> clone() const;
};

#endif  // EVENT_H
