/**
 * @file EventFeedbackManager.cpp
 * Stores per-event guest feedback; coordinator reads aggregate + entries from memory only.
 */
#include "EventFeedbackManager.h"
#include <algorithm>
#include <chrono>
#include <cctype>
#include <cstdint>
#include <set>
#include <vector>

using json = nlohmann::json;

namespace {

constexpr int kMaxCommentLen = 2000;

std::string trimCopy(std::string s) {
    while (!s.empty() &&
           std::isspace(static_cast<unsigned char>(s.front())) != 0) {
        s.erase(0, 1);
    }
    while (!s.empty() &&
           std::isspace(static_cast<unsigned char>(s.back())) != 0) {
        s.pop_back();
    }
    return s;
}

int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
               std::chrono::system_clock::now().time_since_epoch())
        .count();
}

} // namespace

EventFeedbackManager::EventFeedbackManager() = default;

EventFeedbackManager::~EventFeedbackManager() {
    clear();
}

void EventFeedbackManager::clear() {
    byEvent.clear();
}

void EventFeedbackManager::removeEventFeedback(const std::string& eventId) {
    byEvent.erase(eventId);
}

std::string EventFeedbackManager::displayNameForUser(const UserManager& users,
                                                     const std::string& userId) {
    auto u = users.getUser(userId);
    if (!u) {
        return "Guest";
    }
    std::string fn = trimCopy(u->getFirstName());
    std::string ln = trimCopy(u->getLastName());
    if (fn.empty() && ln.empty()) {
        std::string em = trimCopy(u->getEmail());
        return em.empty() ? "Guest" : em;
    }
    if (fn.empty()) {
        return ln;
    }
    if (ln.empty()) {
        return fn;
    }
    return fn + " " + ln;
}

void EventFeedbackManager::fromJson(const json& root) {
    clear();
    if (!root.is_object()) {
        return;
    }
    for (const auto& evPair : root.items()) {
        const std::string& eventId = evPair.key();
        const json& usersNode = evPair.value();
        if (!usersNode.is_object()) {
            continue;
        }
        for (const auto& uPair : usersNode.items()) {
            const std::string& userId = uPair.key();
            const json& row = uPair.value();
            if (!row.is_object()) {
                continue;
            }
            std::string v = row.value("vote", "");
            if (v != "up" && v != "down") {
                continue;
            }
            Row r;
            r.userId = userId;
            r.vote = v;
            r.comment = row.value("comment", "");
            r.updatedAtMs = row.value("updatedAt", static_cast<int64_t>(0));
            byEvent[eventId][userId] = r;
        }
    }
}

json EventFeedbackManager::upsert(EventManager& events, const std::string& eventId,
                                  const std::string& userId, const std::string& vote,
                                  const std::string& comment) {
    auto ev = events.getEvent(eventId);
    if (!ev) {
        json err;
        err["error"] = "Event not found";
        return err;
    }
    if (vote != "up" && vote != "down") {
        json err;
        err["error"] = "vote must be up or down";
        return err;
    }
    if (static_cast<int>(comment.size()) > kMaxCommentLen) {
        json err;
        err["error"] = "Comment too long";
        return err;
    }
    const auto& attendees = ev->getAttendeeIds();
    bool isAttendee = false;
    for (const auto& id : attendees) {
        if (id == userId) {
            isAttendee = true;
            break;
        }
    }
    if (!isAttendee) {
        json err;
        err["error"] = "User must have RSVPed to this event";
        return err;
    }

    Row r;
    r.userId = userId;
    r.vote = vote;
    r.comment = comment;
    r.updatedAtMs = nowMs();
    byEvent[eventId][userId] = r;

    json fb;
    fb["vote"] = r.vote;
    fb["comment"] = r.comment;
    fb["updatedAt"] = r.updatedAtMs;

    json ok;
    ok["success"] = true;
    ok["feedback"] = fb;
    return ok;
}

json EventFeedbackManager::getGuestView(const EventManager& events, const std::string& eventId,
                                        const std::string& userId) const {
    if (!events.getEvent(eventId)) {
        json err;
        err["error"] = "Event not found";
        return err;
    }
    json out;
    out["role"] = "guest";
    auto evIt = byEvent.find(eventId);
    if (evIt == byEvent.end()) {
        out["myFeedback"] = nullptr;
        return out;
    }
    auto uIt = evIt->second.find(userId);
    if (uIt == evIt->second.end()) {
        out["myFeedback"] = nullptr;
        return out;
    }
    const Row& r = uIt->second;
    json mf;
    mf["vote"] = r.vote;
    mf["comment"] = r.comment;
    mf["updatedAt"] = r.updatedAtMs;
    out["myFeedback"] = mf;
    return out;
}

json EventFeedbackManager::getCoordinatorView(const EventManager& events, const UserManager& users,
                                            const std::string& eventId) const {
    json out;
    auto ev = events.getEvent(eventId);
    if (!ev) {
        out["error"] = "Event not found";
        return out;
    }
    const auto attendeeIdsVec = ev->getAttendeeIds();
    std::set<std::string> attendeeSet(attendeeIdsVec.begin(), attendeeIdsVec.end());

    int upvotes = 0;
    int downvotes = 0;
    struct Item {
        int64_t t;
        json j;
    };
    std::vector<Item> items;

    auto evIt = byEvent.find(eventId);
    if (evIt != byEvent.end()) {
        items.reserve(evIt->second.size());
        for (const auto& pair : evIt->second) {
            const std::string& uid = pair.first;
            const Row& r = pair.second;
            if (attendeeSet.count(uid) == 0) {
                continue;
            }
            if (r.vote == "up") {
                upvotes++;
            } else if (r.vote == "down") {
                downvotes++;
            } else {
                continue;
            }
            json e;
            e["userId"] = uid;
            e["displayName"] = displayNameForUser(users, uid);
            e["vote"] = r.vote;
            e["comment"] = r.comment;
            e["updatedAt"] = r.updatedAtMs;
            items.push_back({r.updatedAtMs, e});
        }
    }

    std::sort(items.begin(), items.end(),
              [](const Item& a, const Item& b) { return a.t > b.t; });

    json arr = json::array();
    for (const auto& it : items) {
        arr.push_back(it.j);
    }

    out["role"] = "coordinator";
    out["upvotes"] = upvotes;
    out["downvotes"] = downvotes;
    out["entries"] = arr;
    return out;
}
