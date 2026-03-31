#ifndef SOCIAL_EVENT_H
#define SOCIAL_EVENT_H

#include "Event.h"

/**
 * OOP PRINCIPLE: INHERITANCE
 * 
 * SocialEvent inherits from Event for brotherhood and social activities.
 * 
 * Example: Formals, mixers, brotherhood retreats, game nights
 */
class SocialEvent : public Event {
private:
    std::string theme;
    bool isFormal;
    bool requiresTicket;
    double ticketPrice;
    int ticketsSold;
    int maxCapacity;
    std::string venue;
    bool hasAlcohol;  // 21+ restriction
    std::string partnerSorority;  // For mixers
    std::vector<std::string> plannedActivities;
    std::string transportationInfo;
    
public:
    SocialEvent();
    SocialEvent(const std::string& id, const std::string& title,
                const std::string& description, std::time_t date,
                const std::string& location, const std::string& coordinatorId,
                const std::string& theme, bool isFormal);
    
    // Getters
    std::string getTheme() const { return theme; }
    bool getIsFormal() const { return isFormal; }
    bool getRequiresTicket() const { return requiresTicket; }
    double getTicketPrice() const { return ticketPrice; }
    int getTicketsSold() const { return ticketsSold; }
    int getMaxCapacity() const { return maxCapacity; }
    std::string getVenue() const { return venue; }
    bool getHasAlcohol() const { return hasAlcohol; }
    std::string getPartnerSorority() const { return partnerSorority; }
    std::vector<std::string> getPlannedActivities() const { return plannedActivities; }
    std::string getTransportationInfo() const { return transportationInfo; }
    
    // Setters
    void setTheme(const std::string& t) { theme = t; }
    void setIsFormal(bool formal) { isFormal = formal; }
    void setRequiresTicket(bool ticket) { requiresTicket = ticket; }
    void setTicketPrice(double price) { ticketPrice = price; }
    void setMaxCapacity(int capacity) { maxCapacity = capacity; }
    void setVenue(const std::string& v) { venue = v; }
    void setHasAlcohol(bool alcohol) { hasAlcohol = alcohol; }
    void setPartnerSorority(const std::string& sorority) { partnerSorority = sorority; }
    void setTransportationInfo(const std::string& info) { transportationInfo = info; }
    
    // Ticket operations
    bool sellTicket();
    bool refundTicket();
    int getAvailableTickets() const;
    double getTotalRevenue() const;
    bool isSoldOut() const;
    
    // Activity management
    void addActivity(const std::string& activity);
    void removeActivity(const std::string& activity);
    
    /**
     * OOP PRINCIPLE: POLYMORPHISM
     * Override base class methods for social event-specific behavior
     */
    json toJson() const override;
    void fromJson(const json& j) override;
    std::string getEventType() const override { return "Social"; }
    std::string getEventDetails() const override;
    bool isValid() const override;
    std::shared_ptr<Event> clone() const override;
};

#endif // SOCIAL_EVENT_H