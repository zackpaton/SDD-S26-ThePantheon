/**
 * @file UserManager.cpp
 * Registry of User objects keyed by uid; factory by role string.
 */
#include "UserManager.h"

using json = nlohmann::json;

UserManager::UserManager() = default;

UserManager::~UserManager() {
    clear();
}

std::shared_ptr<User> UserManager::createUserFromJson(const json& j) {
    std::string r = j.value("role", "");
    if (r == "Event Coordinator") {
        auto u = std::make_shared<EventCoordinator>();
        u->fromJson(j);
        return u;
    }
    auto g = std::make_shared<GuestUser>();
    g->fromJson(j);
    return g;
}

bool UserManager::upsertUser(const std::shared_ptr<User>& user) {
    if (!user || !user->isValid()) {
        return false;
    }
    users[user->getId()] = user;
    return true;
}

bool UserManager::upsertFromJson(const json& j) {
    auto user = UserManager::createUserFromJson(j);
    return upsertUser(user);
}

std::shared_ptr<User> UserManager::getUser(const std::string& userId) const {
    auto it = users.find(userId);
    if (it != users.end()) {
        return it->second;
    }
    return nullptr;
}

json UserManager::getUsersBatch(const std::vector<std::string>& uids) const {
    json arr = json::array();
    for (const auto& uid : uids) {
        auto u = getUser(uid);
        if (u) {
            json row = u->toJson();
            row["uid"] = uid;
            arr.push_back(row);
        } else {
            json row;
            row["uid"] = uid;
            arr.push_back(row);
        }
    }
    return arr;
}

json UserManager::getAllUsersJson() const {
    json arr = json::array();
    for (const auto& pair : users) {
        json row = pair.second->toJson();
        row["uid"] = pair.first;
        arr.push_back(row);
    }
    return arr;
}

json UserManager::toJson() const {
    json arr = json::array();
    for (const auto& pair : users) {
        arr.push_back(pair.second->toJson());
    }
    return arr;
}

void UserManager::fromJson(const json& j) {
    clear();
    if (!j.is_array()) {
        return;
    }
    for (const auto& item : j) {
        auto u = UserManager::createUserFromJson(item);
        if (u && u->isValid()) {
            users[u->getId()] = u;
        }
    }
}

void UserManager::clear() {
    users.clear();
}
