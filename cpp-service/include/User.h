#ifndef USER_H
#define USER_H

#include <memory>
#include <string>
#include "nlohmann_json_include.hpp"

/**
 * @file User.h
 * Abstract user profile (Firebase fields); subclasses distinguish guest vs event coordinator.
 */
class User {
protected:
    std::string id;
    std::string email;
    std::string firstName;
    std::string lastName;
    std::string role;
    std::string classYear;
    std::string major;
    std::string interests;

public:
    User();
    virtual ~User() = default;

    std::string getId() const { return id; }
    std::string getEmail() const { return email; }
    std::string getFirstName() const { return firstName; }
    std::string getLastName() const { return lastName; }
    std::string getRole() const { return role; }
    std::string getClassYear() const { return classYear; }
    std::string getMajor() const { return major; }
    std::string getInterests() const { return interests; }

    void setId(const std::string& v) { id = v; }
    void setEmail(const std::string& v) { email = v; }
    void setFirstName(const std::string& v) { firstName = v; }
    void setLastName(const std::string& v) { lastName = v; }
    void setRole(const std::string& v) { role = v; }
    void setClassYear(const std::string& v) { classYear = v; }
    void setMajor(const std::string& v) { major = v; }
    void setInterests(const std::string& v) { interests = v; }

    /** Discriminator for JSON / polymorphic handling ("GuestUser" | "EventCoordinator"). */
    virtual std::string getUserKind() const = 0;

    virtual nlohmann::json toJson() const;
    virtual void fromJson(const nlohmann::json& j);
    virtual bool isValid() const;

    virtual std::shared_ptr<User> clone() const = 0;
};

#endif  // USER_H
