# Builds the calendar_service executable: C++17, nlohmann/json from third_party, headers under include/,
# sources under src/, and strict compiler warnings (MSVC /W4 or GCC/Clang -Wall -Wextra -Wpedantic).
cmake_minimum_required(VERSION 3.10)
project(FraternityCalendarService)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/json/include
)

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