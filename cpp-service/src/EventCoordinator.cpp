/**
 * @file EventCoordinator.cpp
 * Event Coordinator profile with fraternity field.
 */
#include "EventCoordinator.h"

using json = nlohmann::json;

EventCoordinator::EventCoordinator() = default;

json EventCoordinator::toJson() const {
    json j = User::toJson();
    j["fraternity"] = fraternity;
    return j;
}

void EventCoordinator::fromJson(const json& j) {
    User::fromJson(j);
    if (j.contains("fraternity")) {
        fraternity = j["fraternity"].get<std::string>();
    }
}

bool EventCoordinator::isValid() const {
    return User::isValid() && role == "Event Coordinator";
}

std::shared_ptr<User> EventCoordinator::clone() const {
    return std::make_shared<EventCoordinator>(*this);
}
