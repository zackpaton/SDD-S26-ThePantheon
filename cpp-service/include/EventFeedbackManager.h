#ifndef EVENT_FEEDBACK_MANAGER_H
#define EVENT_FEEDBACK_MANAGER_H

#include "EventManager.h"
#include "UserManager.h"
#include <map>
#include <nlohmann/json.hpp>
#include <string>

/**
 * In-memory RSVP guest feedback (up/down + comment) per event, keyed by user id.
 * Synced from Firebase on startup; Node writes to Firebase after each C++ upsert.
 */
class EventFeedbackManager {
private:
    struct Row {
        std::string userId;
        std::string vote;
        std::string comment;
        int64_t updatedAtMs;
    };

    std::map<std::string, std::map<std::string, Row>> byEvent;

    std::string displayNameForUser(const UserManager& users, const std::string& userId) const;

public:
    EventFeedbackManager();
    ~EventFeedbackManager();

    /** Replace all feedback from Firebase-shaped JSON: { eventId: { userId: { vote, comment, updatedAt } } }. */
    void fromJson(const nlohmann::json& root);

    /**
     * Upserts feedback for one guest. Sets updatedAt to current time (ms).
     * Validates event exists and userId is in attendee list; vote is up|down; comment length.
     */
    nlohmann::json upsert(EventManager& events, const std::string& eventId, const std::string& userId,
                            const std::string& vote, const std::string& comment);

    /** Guest view: { role, myFeedback } or { error }. */
    nlohmann::json getGuestView(const EventManager& events, const std::string& eventId,
                                const std::string& userId) const;

    /**
     * Coordinator aggregate + per-row entries (attendee-filtered), names from UserManager when possible.
     * { role, upvotes, downvotes, entries: [{ userId, displayName, vote, comment, updatedAt }] }.
     */
    nlohmann::json getCoordinatorView(const EventManager& events, const UserManager& users,
                                      const std::string& eventId) const;

    /** Drops all feedback rows when an event is deleted. */
    void removeEventFeedback(const std::string& eventId);

    void clear();
};

#endif
