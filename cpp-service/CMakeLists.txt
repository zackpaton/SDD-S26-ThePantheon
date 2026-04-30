# Builds the calendar_service executable: C++17, nlohmann/json (vendored
# under third_party/json OR fetched by CMake), headers under include/, sources
# under src/, and strict compiler warnings (MSVC /W4 or GCC/Clang -Wall -Wextra
# -Wpedantic).
cmake_minimum_required(VERSION 3.14)
project(FraternityCalendarService)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# compile_commands.json for clang-tidy / IDE (Ninja or Unix Makefiles on WSL/Linux).
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Source files
set(SOURCES
    src/Event.cpp
    src/RecruitmentEvent.cpp
    src/PhilanthropyEvent.cpp
    src/SocialEvent.cpp
    src/EventManager.cpp
    src/User.cpp
    src/GuestUser.cpp
    src/EventCoordinator.cpp
    src/UserManager.cpp
    src/EventFeedbackManager.cpp
    src/main.cpp
)

# Create executable
add_executable(calendar_service ${SOURCES})

target_include_directories(calendar_service PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# nlohmann/json: vendored under third_party/json, or FetchContent. Mark includes as
# SYSTEM so clang/clang-tidy do not drill into third-party template code (avoids
# hundreds of thousands of spurious tidy diagnostics).
set(JSON_SYSTEM_INCLUDE "")
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/third_party/json/include/nlohmann/json.hpp")
  set(JSON_SYSTEM_INCLUDE "${CMAKE_CURRENT_SOURCE_DIR}/third_party/json/include")
  message(STATUS "Using vendored nlohmann/json (third_party/json)")
else()
  include(FetchContent)
  FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
    GIT_SHALLOW TRUE
  )
  FetchContent_MakeAvailable(nlohmann_json)
  set(JSON_SYSTEM_INCLUDE "${nlohmann_json_SOURCE_DIR}/include")
  message(STATUS "Using FetchContent nlohmann/json (v3.11.3)")
endif()
target_include_directories(calendar_service SYSTEM PRIVATE "${JSON_SYSTEM_INCLUDE}")

# Set output directory
set_target_properties(calendar_service PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
)

# Enable warnings
if(MSVC)
    target_compile_options(calendar_service PRIVATE /W4)
else()
    target_compile_options(calendar_service PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Optional: run clang-tidy using the compile database (requires clang-tidy on PATH).
find_program(CLANG_TIDY_EXE NAMES clang-tidy clang-tidy-18 clang-tidy-17 clang-tidy-16)
file(GLOB TIDY_CPP CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
if(CLANG_TIDY_EXE AND TIDY_CPP)
  add_custom_target(
    clang-tidy
    COMMAND ${CLANG_TIDY_EXE}
      "--extra-arg-before=-isystem${JSON_SYSTEM_INCLUDE}"
      -p ${CMAKE_BINARY_DIR}
      ${TIDY_CPP}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Running clang-tidy with compile_commands.json"
    VERBATIM
  )
elseif(NOT CLANG_TIDY_EXE)
  message(STATUS "clang-tidy not found (optional). Install: sudo apt install clang-tidy")
endif()