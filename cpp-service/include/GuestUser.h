#ifndef GUEST_USER_H
#define GUEST_USER_H

#include "User.h"

/**
 * Guest User role — no fraternity-specific fields.
 */
class GuestUser : public User {
public:
    GuestUser();
    ~GuestUser() override = default;

    std::string getUserKind() const override { return "GuestUser"; }

    nlohmann::json toJson() const override;
    void fromJson(const nlohmann::json& j) override;
    bool isValid() const override;

    std::shared_ptr<User> clone() const override;
};

#endif
