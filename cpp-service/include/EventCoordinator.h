#ifndef EVENT_COORDINATOR_H
#define EVENT_COORDINATOR_H

#include "User.h"

/**
 * Event Coordinator — extends User with fraternity chapter affiliation.
 */
class EventCoordinator : public User {
private:
    std::string fraternity;

public:
    EventCoordinator();
    ~EventCoordinator() override = default;

    std::string getFraternity() const { return fraternity; }
    void setFraternity(const std::string& f) { fraternity = f; }

    std::string getUserKind() const override { return "EventCoordinator"; }

    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    bool isValid() const override;

    std::shared_ptr<User> clone() const override;
};

#endif
