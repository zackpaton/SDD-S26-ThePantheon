/**
 * @file User.cpp
 * Base user profile JSON serialization shared by GuestUser and EventCoordinator.
 */
#include "User.h"

using json = nlohmann::json;

User::User() = default;

json User::toJson() const {
    json j;
    j["id"] = id;
    j["email"] = email;
    j["firstName"] = firstName;
    j["lastName"] = lastName;
    j["role"] = role;
    j["classYear"] = classYear;
    j["major"] = major;
    j["interests"] = interests;
    j["userKind"] = getUserKind();
    return j;
}

void User::fromJson(const json& j) {
    if (j.contains("id")) {
        id = j["id"].get<std::string>();
    }
    if (j.contains("email")) {
        email = j["email"].get<std::string>();
    }
    if (j.contains("firstName")) {
        firstName = j["firstName"].get<std::string>();
    }
    if (j.contains("lastName")) {
        lastName = j["lastName"].get<std::string>();
    }
    if (j.contains("role")) {
        role = j["role"].get<std::string>();
    }
    if (j.contains("classYear")) {
        classYear = j["classYear"].get<std::string>();
    }
    if (j.contains("major")) {
        major = j["major"].get<std::string>();
    }
    if (j.contains("interests")) {
        interests = j["interests"].get<std::string>();
    }
}

bool User::isValid() const {
    return !id.empty() && !role.empty();
}
