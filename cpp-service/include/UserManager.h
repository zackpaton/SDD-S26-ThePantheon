#ifndef USER_MANAGER_H
#define USER_MANAGER_H

#include "User.h"
#include "GuestUser.h"
#include "EventCoordinator.h"
#include <map>
#include <memory>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

/**
 * @file UserManager.h
 * In-memory user registry by Firebase uid: upsert, batch read, and JSON bulk load (mirrors EventManager).
 */
class UserManager {
private:
    std::map<std::string, std::shared_ptr<User>> users;

    std::shared_ptr<User> createUserFromJson(const nlohmann::json& j);

public:
    UserManager();
    ~UserManager();

    bool upsertUser(std::shared_ptr<User> user);
    /** Parses JSON and replaces or inserts the user (correct subclass by role). */
    bool upsertFromJson(const nlohmann::json& j);

    std::shared_ptr<User> getUser(const std::string& userId) const;
    nlohmann::json getUsersBatch(const std::vector<std::string>& uids) const;
    nlohmann::json getAllUsersJson() const;

    nlohmann::json toJson() const;
    void fromJson(const nlohmann::json& j);
    void clear();

    int getUserCount() const { return static_cast<int>(users.size()); }
};

#endif  // USER_MANAGER_H
