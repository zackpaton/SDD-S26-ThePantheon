#ifndef EVENT_H
#define EVENT_H

#include <string>
#include <ctime>
#include <memory>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

/**
 * OOP PRINCIPLE: ENCAPSULATION
 * 
 * The Event class encapsulates all event data with private members.
 * External code can only access/modify data through public getters/setters,
 * allowing us to control how data is accessed and maintain data integrity.
 * 
 * Example: The 'id' cannot be changed arbitrarily - it's set through constructor
 * and protected from external modification.
 */
class Event {
protected:  // INHERITANCE: Protected members accessible to derived classes
    std::string id;
    std::string title;
    std::string description;
    std::time_t date;
    std::time_t startTime;
    std::time_t endTime;
    std::string location;
    std::string coordinatorId;  // ID of event coordinator
    int expectedAttendees;
    bool isPublic;  // Public to chapter members or open to potential recruits
    std::vector<std::string> attendeeIds;

public:
    Event();
    Event(const std::string& id, const std::string& title, const std::string& description,
          std::time_t date, const std::string& location, const std::string& coordinatorId);
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Virtual destructor ensures proper cleanup of derived classes
     */
    virtual ~Event() = default;
    
    // ENCAPSULATION: Getters provide read-only access
    std::string getId() const { return id; }
    std::string getTitle() const { return title; }
    std::string getDescription() const { return description; }
    std::time_t getDate() const { return date; }
    std::time_t getStartTime() const { return startTime; }
    std::time_t getEndTime() const { return endTime; }
    std::string getLocation() const { return location; }
    std::string getCoordinatorId() const { return coordinatorId; }
    int getExpectedAttendees() const { return expectedAttendees; }
    bool getIsPublic() const { return isPublic; }
    std::vector<std::string> getAttendeeIds() const { return attendeeIds; }
    
    // ENCAPSULATION: Setters provide controlled modification
    void setTitle(const std::string& t) { title = t; }
    void setDescription(const std::string& desc) { description = desc; }
    void setDate(std::time_t d) { date = d; }
    void setStartTime(std::time_t st) { startTime = st; }
    void setEndTime(std::time_t et) { endTime = et; }
    void setLocation(const std::string& loc) { location = loc; }
    void setCoordinatorId(const std::string& cId) { coordinatorId = cId; }
    void setExpectedAttendees(int count) { expectedAttendees = count; }
    void setIsPublic(bool pub) { isPublic = pub; }
    
    // Attendee management
    void addAttendee(const std::string& userId);
    void removeAttendee(const std::string& userId);
    bool isAttending(const std::string& userId) const;
    int getActualAttendeeCount() const { return attendeeIds.size(); }
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Virtual methods can be overridden by derived classes to provide
     * specialized behavior while maintaining a common interface.
     * 
     * Example: A RecruitmentEvent might include rush-specific fields
     * in its JSON representation, while a PhilanthropyEvent includes
     * fundraising goals.
     */
    virtual json toJson() const;
    virtual void fromJson(const json& j);
    virtual std::string getEventType() const { return "General"; }
    virtual std::string getEventDetails() const;
    virtual bool isValid() const;
    
    // Clone for copying polymorphic objects
    virtual std::shared_ptr<Event> clone() const;
};

#endif // EVENT_H