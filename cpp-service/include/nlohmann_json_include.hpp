#ifndef CPP_SERVICE_NLOHMANN_JSON_INCLUDE_HPP_
#define CPP_SERVICE_NLOHMANN_JSON_INCLUDE_HPP_

/**
 * Single include point for nlohmann/json. Pragmas mark everything pulled in from
 * here as “system” code so Clang/clang-tidy suppress diagnostics inside the
 * library (millions of template instantiations otherwise).
 */
#if defined(__clang__)
#pragma clang system_header
#elif defined(__GNUC__)
#pragma GCC system_header
#endif

#include <nlohmann/json.hpp>

#endif  // CPP_SERVICE_NLOHMANN_JSON_INCLUDE_HPP_
