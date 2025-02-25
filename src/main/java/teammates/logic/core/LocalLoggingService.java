package teammates.logic.core;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import teammates.common.datatransfer.ErrorLogEntry;
import teammates.common.datatransfer.FeedbackSessionLogEntry;
import teammates.common.datatransfer.QueryLogsParams;
import teammates.common.datatransfer.QueryLogsResults;
import teammates.common.datatransfer.attributes.FeedbackSessionAttributes;
import teammates.common.datatransfer.attributes.StudentAttributes;

/**
 * Holds functions for operations related to logs reading/writing in local dev environment.
 *
 * <p>The current implementation uses an in-memory storage of logs to simulate the logs
 * retention locally for feedback session logs only. It is not meant as a replacement but
 * merely for testing purposes.
 */
public class LocalLoggingService implements LogService {

    private static final List<FeedbackSessionLogEntry> LOCAL_LOG_ENTRIES = new ArrayList<>();

    private final StudentsLogic studentsLogic = StudentsLogic.inst();
    private final FeedbackSessionsLogic fsLogic = FeedbackSessionsLogic.inst();

    @Override
    public List<ErrorLogEntry> getRecentErrorLogs() {
        // Not supported in dev server
        return new ArrayList<>();
    }

    @Override
    public QueryLogsResults queryLogs(QueryLogsParams queryLogsParams) {
        // Not supported in dev server
        return new QueryLogsResults(Collections.emptyList(), null);
    }

    @Override
    public void createFeedbackSessionLog(String courseId, String email, String fsName, String fslType) {
        StudentAttributes student = studentsLogic.getStudentForEmail(courseId, email);
        FeedbackSessionAttributes feedbackSession = fsLogic.getFeedbackSession(fsName, courseId);

        FeedbackSessionLogEntry logEntry = new FeedbackSessionLogEntry(student, feedbackSession,
                fslType, Instant.now().toEpochMilli());
        LOCAL_LOG_ENTRIES.add(logEntry);
    }

    @Override
    public List<FeedbackSessionLogEntry> getFeedbackSessionLogs(String courseId, String email,
            Instant startTime, Instant endTime, String fsName) {
        return LOCAL_LOG_ENTRIES
                .stream()
                .filter(log -> log.getFeedbackSession().getCourseId().equals(courseId))
                .filter(log -> email == null || log.getStudent().getEmail().equals(email))
                .filter(log -> fsName == null || log.getFeedbackSession().getFeedbackSessionName().equals(fsName))
                .filter(log -> startTime == null || log.getTimestamp() >= startTime.toEpochMilli())
                .filter(log -> endTime == null || log.getTimestamp() <= endTime.toEpochMilli())
                .collect(Collectors.toList());
    }

}
