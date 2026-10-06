#!/bin/bash
# 1. Performance Governor & Minimum 4.0 GHz
for cpu in /sys/devices/system/cpu/cpu[0-9]*/cpufreq; do
    [ -f "$cpu/scaling_governor" ] && echo performance > "$cpu/scaling_governor"
    [ -f "$cpu/scaling_min_freq" ] && echo 4000000 > "$cpu/scaling_min_freq"
    [ -f "$cpu/energy_performance_preference" ] && echo performance > "$cpu/energy_performance_preference"
done

# 2. Intel P-State Maximum Performance Bias
if [ -d "/sys/devices/system/cpu/intel_pstate" ]; then
    [ -f "/sys/devices/system/cpu/intel_pstate/min_perf_pct" ] && echo 98 > /sys/devices/system/cpu/intel_pstate/min_perf_pct
    [ -f "/sys/devices/system/cpu/intel_pstate/hwp_dynamic_boost" ] && echo 1 > /sys/devices/system/cpu/intel_pstate/hwp_dynamic_boost
fi

# 3. Disable deep C-States to prevent frequency downscaling during idle
for s in /sys/devices/system/cpu/cpu*/cpuidle/state[1-3]/disable; do
    [ -f "$s" ] && echo 1 > "$s"
done

# 4. Maximum Fan & Thermal Performance Profile
[ -f /sys/firmware/acpi/platform_profile ] && echo performance > /sys/firmware/acpi/platform_profile
for c in /sys/class/thermal/cooling_device*; do
    if [ "$(cat $c/type 2>/dev/null)" = "Fan" ]; then
        [ -f "$c/cur_state" ] && echo 1 > "$c/cur_state"
    fi
done
