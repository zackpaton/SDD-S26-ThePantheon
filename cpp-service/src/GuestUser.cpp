/**
 * @file GuestUser.cpp
 * Guest User role implementation.
 */
#include "GuestUser.h"

using json = nlohmann::json;

GuestUser::GuestUser() = default;

json GuestUser::toJson() const {
    return User::toJson();
}

void GuestUser::fromJson(const json& j) {
    User::fromJson(j);
}

bool GuestUser::isValid() const {
    return User::isValid();
}

std::shared_ptr<User> GuestUser::clone() const {
    return std::make_shared<GuestUser>(*this);
}
